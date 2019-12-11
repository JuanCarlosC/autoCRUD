# autoCRUD

### Create express app and use the auotCRUD util:


```
const express = require('express')
const resources = [{ name: 'Users', properties: { name: { type: String }}}]

const app = express()

autoCRUD.create({
    expressApp: app,
    resources: resources,
    route: '/api/v1/'
})

app.listen(8888, (err) => {
    if (err) process.exit(1)
    // ... any other code
})

```

### Generates the following routes for you


GET
/api/v1/users

POST
/api/v1/users

PUT
/api/v1/users/{id}

DELETE
/api/v1/users/{id}
