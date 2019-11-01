// FIXME: Make this whole thang a package and share it because you rock!
const Cloudant = require('@cloudant/cloudant');
const couchbackup = require('@cloudant/couchbackup');
const fs = require('fs');
const path = require('path');
const credentialsPath = path.join(__dirname, './credentials/');
const security = JSON.parse(fs.readFileSync(path.join(credentialsPath, 'cloudant-security.json')));
const services = JSON.parse(fs.readFileSync(path.join(credentialsPath, 'cloudant-services.json')));
/**
 * @description Format URL based on cloudant service name and permissions, where permissions is either: readonly || admin.
 * @param {string} serviceLabel 
 * @param {string} permissions 
 * 
 */
const formatURL = (serviceLabel, permissions = 'readonly') => {
    // TODO: Consider varying drill-down to create the URL.
    const userType = (permissions === 'readonly') ? 'master-reader' : ('admin') ? 'instance-admin' : null;
    if (!userType) throw 'Format URL expects permissions parameter to be either: readonly || admin.'
    if (!serviceLabel) throw 'Sevice name is crucial to do the thing.';
    if (!security[serviceLabel]) throw 'No security settings defined for ' + serviceLabel;
    if (!security[serviceLabel][userType]) throw `No ${userType} defined for ${serviceLabel}`;
    return `https://${security[serviceLabel][userType]}@${services[serviceLabel]}`;
};
//
let cloudant, currentService;
//
module.exports = {
    createAPIKey: async () => {
        // Adding readonly user.
        if (!cloudant) throw 'Cloudant is not connected.';
        const api = await dbTools.getAPIKey();
        console.log('              API key: ', api.key);
        console.log('Password for this key: ', api.password);
        console.log('!!!IMPORTANT: SAVE PASSWORD NOW!!! Password is not retrievable.')
    },
    addReadOnlyUsers: async (apiKey) => {
        return await Promise.all(security.map(x => {
            const readerUser = { [apiKey]: ['_reader'] };
            return dbTools.setSecurity(x.name, readerUser);
        }));
    },
    ping: async () => {
        if (!cloudant) throw 'Cloudant is not connected.';
        return await cloudant.ping().then((res) => {
            const { couchdb, version, vendor } = res;
            const connectedMessage = `${couchdb} to ${vendor.name} (Couch v${version} / Cloudant v${vendor.version})`;
            const line = new Array(connectedMessage.length).fill('-').join('');

            return `${line}\n${connectedMessage}\n${line}`;
        }).catch(err => console.log('ping catch ping: ', err));
    },
    listDatabases: async () => await cloudant.db.list({ include_documents: false }).then((res) => res),
    getConnection: (serviceName) => {
        if (!serviceName) throw 'Sevice name is crucial to do the thing.';
        if (!cloudant || serviceName !== currentService) {
            currentService = serviceName;
            const [account, password] = security[serviceName]['instance-admin'].split(':');
            cloudant = Cloudant({ account, password });
        }
        return cloudant;
    },
    getSecurity: async (name) => {
        const db = cloudant.db.use(name);
        return new Promise((resolve, reject) => {
            db.get_security((err, res) => {
                if (err) reject(err);
                resolve({ name: name, security: res });
            });
        });
    },
    setSecurity: async (name, security) => {
        const db = cloudant.db.use(name);
        return new Promise((resolve, reject) => {
            db.set_security(security, (err, res) => {
                if (err) reject(err);
                resolve(res);
            });
        });
    },
    getAPIKey: async () => {
        return new Promise((resolve, reject) => {
            cloudant.generate_api_key((err, api) => {
                if (err) reject(err);
                resolve(api);
            });
        });
    },
    backups: {
        createBackup: (serviceLabel, dbName) => {
            if (!currentService) currentService = serviceLabel;
            const backupDirectory = path.join(__dirname, currentService);
            if (!fs.existsSync(backupDirectory)) fs.mkdirSync(backupDirectory);
            //
            const backupFileName = path.join(backupDirectory, dbName + '.json');
            const writeStream = fs.createWriteStream(backupFileName);
            //
            let start = 0;
            writeStream.on('open', () => {
                start = new Date().getTime();
                console.log('Write stream opened.');
            });
            writeStream.on('close', () => {
                console.log('Write stream closed.');
                console.log(backupFileName);
                console.log(`[${currentService}:${dbName}] - backup took ${new Date().getTime() - start}ms`);
            });
            const url = formatURL(currentService, 'readonly');
            couchbackup.backup(
                url + '/' + dbName,
                writeStream, //process.stdout,
                { parallelism: 10 }, // Could be mode: 'shallow' and will only grab most recent revisions. Doesn't allow parallel connections though...
                (err, data) => {
                    if (err) {
                        console.error("Naw!!! " + err);
                    } else {
                        console.error("%d records backed up.", data.total); // Return looks like: {"total":14}
                    }
                }
            );
        },
        doRestore: (serviceLabel, dbName) => {
            // Won't work if no 'instance-admin' is defined for service in cloudant-security.
            if (!currentService) currentService = serviceLabel;
            const backupFileName = path.join(__dirname, currentService, dbName + '.json');
            const readStream = fs.createReadStream(backupFileName);
            readStream.on('open', () => console.log('Read stream: %s opened.', backupFileName));
            readStream.on('close', () => console.log('Read stream: %s closed.', backupFileName));
            const url = masterURL(serviceLabel, 'admin');
            couchbackup.restore(
                readStream, //process.stdin,
                url + '/' + dbName,
                { parallelism: 10 },
                (err, data) => {
                    if (err) {
                        console.error("Failed! " + err);
                    } else {
                        console.error("%d records restored.", data.total); // {"total":14}
                    }
                }
            );
        }
    }
};