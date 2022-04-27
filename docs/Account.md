<a name="Account"></a>

## Account ⇐ <code>GraphandModel</code>
Account model. Use [client.getModel("Account")](Client#getModel) to use this model

**Kind**: global class  
**Extends**: <code>GraphandModel</code>  

* [Account](Account.md#Account) ⇐ <code>GraphandModel</code>
    * _instance_
        * [.raw](#) ⇒ <code>\*</code>
        * [.generateToken()](Account.md#Account+generateToken)
        * [.update(update, [options])](#)
        * [.delete([options])](#)
        * [.clone(locale)](#)
        * [.get(slug, [parse], _locale, fallback)](#)
        * [.set(slug, value, [upsert], [parse])](#)
        * [.assign(values, [upsert], updatedAtNow)](#)
        * [.subscribe(callback)](#)
        * [.isTemporary()](#)
        * [.serialize()](#) ⇒ <code>Object</code>
        * [.toJSON()](#) ⇒ <code>Object</code>
    * _static_
        * [.login(credentials)](#Account.login)
        * [.register(payload, [hooks])](#Account.register)
        * [.generateToken(id)](#Account.generateToken) ⇒ <code>string</code>
        * [.getCurrent([populate], opts)](#Account.getCurrent) ⇒ [<code>Account</code>](Account.md#Account)


* * *

<a name=""></a>

### account.raw ⇒ <code>\*</code>
Returns raw data of instance

**Kind**: instance property of [<code>Account</code>](Account.md#Account)  

* * *

<a name="Account+generateToken"></a>

### account.generateToken()
[admin only] Generate a new token for current account

**Kind**: instance method of [<code>Account</code>](Account.md#Account)  

* * *

<a name=""></a>

### account.update(update, [options])
Update current instance

**Kind**: instance method of [<code>Account</code>](Account.md#Account)  

| Param | Type | Description |
| --- | --- | --- |
| update | <code>Update</code> | payload to apply. Query is already set with current instance id |
| [options] |  |  |

**Example**  
```js
// set title toto on the current instance
this.update({ set: { ...payload } })
```

* * *

<a name=""></a>

### account.delete([options])
Delete current instance

**Kind**: instance method of [<code>Account</code>](Account.md#Account)  

| Param |
| --- |
| [options] | 

**Example**  
```js
this.delete().then(() => console.log("deleted"))
```

* * *

<a name=""></a>

### account.clone(locale)
Clone the instance

**Kind**: instance method of [<code>Account</code>](Account.md#Account)  

| Param |
| --- |
| locale | 


* * *

<a name=""></a>

### account.get(slug, [parse], _locale, fallback)
Model instance getter. Returns the value for the specified key

**Kind**: instance method of [<code>Account</code>](Account.md#Account)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| slug | <code>string</code> |  | The key (field slug) to get |
| [parse] | <code>boolean</code> | <code>true</code> | Default true. If false returns raw value |
| _locale |  |  |  |
| fallback |  | <code>true</code> |  |


* * *

<a name=""></a>

### account.set(slug, value, [upsert], [parse])
Model instance setter. Set value for the specified key

**Kind**: instance method of [<code>Account</code>](Account.md#Account)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| slug | <code>string</code> |  | The key (field slug) to get |
| value | <code>\*</code> |  |  |
| [upsert] | <code>boolean</code> |  | Define if the setter will trigger a store upsert action |
| [parse] | <code>boolean</code> | <code>true</code> | Default true. If false set raw value |


* * *

<a name=""></a>

### account.assign(values, [upsert], updatedAtNow)
Assign multiple values to instance.

**Kind**: instance method of [<code>Account</code>](Account.md#Account)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| values | <code>Object</code> |  |  |
| [upsert] | <code>boolean</code> | <code>true</code> | Define if the setter will trigger a store upsert action |
| updatedAtNow |  | <code>true</code> |  |


* * *

<a name=""></a>

### account.subscribe(callback)
Subscribe to the current instance. The callback will be called each time the instance is updated in store.
If the model is synced (realtime), the callback will be called when the instance is updated via socket

**Kind**: instance method of [<code>Account</code>](Account.md#Account)  

| Param | Description |
| --- | --- |
| callback | The function to call when the instance is updated |


* * *

<a name=""></a>

### account.isTemporary()
Returns true if the current instance is only in memory and not persisted on Graphand.

**Kind**: instance method of [<code>Account</code>](Account.md#Account)  

* * *

<a name=""></a>

### account.serialize() ⇒ <code>Object</code>
Serialize instance. Serialized data could be hydrated with GraphandModel.hydrate

**Kind**: instance method of [<code>Account</code>](Account.md#Account)  

* * *

<a name=""></a>

### account.toJSON() ⇒ <code>Object</code>
Returns JSON-serialized object of the current instance

**Kind**: instance method of [<code>Account</code>](Account.md#Account)  

* * *

<a name="Account.login"></a>

### Account.login(credentials)
Get accessToken with credentials & set token to [Client](Client)

**Kind**: static method of [<code>Account</code>](Account.md#Account)  

| Param | Type | Description |
| --- | --- | --- |
| credentials | <code>Object</code> | Credentials sent to api |


* * *

<a name="Account.register"></a>

### Account.register(payload, [hooks])
Register new account

**Kind**: static method of [<code>Account</code>](Account.md#Account)  

| Param | Type | Default |
| --- | --- | --- |
| payload | <code>Object</code> |  | 
| [hooks] | <code>boolean</code> | <code>true</code> | 


* * *

<a name="Account.generateToken"></a>

### Account.generateToken(id) ⇒ <code>string</code>
[admin only] Generate a new token for account with id

**Kind**: static method of [<code>Account</code>](Account.md#Account)  

| Param | Type |
| --- | --- |
| id | <code>string</code> | 


* * *

<a name="Account.getCurrent"></a>

### Account.getCurrent([populate], opts) ⇒ [<code>Account</code>](Account.md#Account)
Returns current account

**Kind**: static method of [<code>Account</code>](Account.md#Account)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [populate] | <code>boolean</code> | <code>true</code> | . If false, returns only the current account id |
| opts |  |  |  |


* * *

