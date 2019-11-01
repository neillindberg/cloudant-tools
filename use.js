
const dbTools = require('./index');

const fx = async (serviceName) => {
    const instanceConnection = await dbTools.getConnection(serviceName);
    const [ping, dbs] = await Promise.all([
        dbTools.ping(), // test connection
        dbTools.listDatabases()
    ]);
    console.log(ping);
    /////////////////////
    // Reading Operations
    // dbs.sort();
    // console.log('  sorted: ', dbs);
    // // Get record count per db.
    // const counts = await Promise.all(dbs.map(async db => {
    //     const collectionConn = instanceConnection.use(db);
    //     return await collectionConn.list({ include_docs: false }).then(result => {
    //         // list result props: total_rows, offset (0), rows {id, key, value: {}}
    //         return `${db} - ${result.total_rows} total rows`;
    //     });
    // }));
    // console.log(counts);
    // const security = await Promise.all(dbs.map(dbTools.getSecurity));
    // console.log('security: ', JSON.stringify(security));
    // const needsReadOnly = security.filter(x => Object.keys(x.security).length === 0);
    // console.log('readonly: ', needsReadOnly);
    //////////////////
    // Backup Read Op
    // dbs.forEach(db => dbTools.backups.createBackup(serviceName, db));
};

fx();