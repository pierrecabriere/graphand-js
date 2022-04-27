# Graphand javascript client

Graphand-js is the javascript sdk to integrate efficiently graphand.io within your apps.

## Getting started


### Create client

First, you need to create a graphand client for your project

```ts
import Graphand from "graphand-js";

const client = Graphand.createClient({
    project: "yourProjectId"
});
```

### Get model

Then, your client can generate GraphandModel constructor to access your data

```ts
const Account = client.getModel("Account");
const Potatoes = client.getModel("Data:potatoes");
// or get multiple models at once
const [Account, Potatoes] = client.getModels(["Account", "Data:potatoes"]);

Account.getCurrent().then((account) => alert(`Hello ${account.fullname} !`));
Potatoes.getList({}).then((list) => alert(`${list.count} potatoes in list !`));
```

---

See [API reference](docs/README.md)

🚀