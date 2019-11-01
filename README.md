**This is a collection of functions used to read and write to Cloudant DB instances.**

### Required Setup
- You will need a Cloudant instance admin/manager credentials:
    - Follow db link from Cloud Services list.
    - Find the Service Credentials link (current IBM Cloud interface has this on the left-nav).
    - In the Service Credentials table view/copy credentials opening the View Credential links.
- After collecting credentials they can be entered manually, or put them in a file, in folder:
    - _\<app location\>_*/credentials/cloudant-security.json*
- Following is a general shape of the JSON file all instance ops require an instance admin (also usable for write ops per-db):
```
{
    "us-dev": { // NOTE: This should be the name-of-instance (however it should be reflected in logs and backup folder naming)
        "instance-admin": "In credentials and grab the 'username' and the 'password'. Separate these values with a colon (username:password)",
        "master-reader (optional - if per-db users exist)": "This is for when you have added the same user with (at least) _reader rights to every db in the instance (username:password)",
        "per-db (optional - no need if you've setup a master-reader)": [
            {
                "name": "_replicator",
                "user-credentials": "again, using the pattern: username:password"
            },
            {
                "name": "foo",
                "user-credentials": "foo-user:foo-password"
            }
        ]
    },
    "name-of-another-instance": "...repeat the above structure"
}
```
**Services File**

Create a file \<app location\>/credentials/_cloudant-services.json_
This is to hold the URL of services, separating the addresses from any credential information.
Enter whatever environments in the following form:
```
{
    "us-dev": "credentials json value for 'host' - for us-dev",  // NOTE: The key here should match a security instance name.
    "eu-dev": "credentials json value for 'host' - for eu-dev"
}
```

### Start service

`npm run start`

