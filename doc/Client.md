<a name="Client"></a>

## Client
Base Graphand Client class

**Kind**: global class  

* [Client](#Client)
    * [new Client(project, [options])](#new_Client_new)
    * _instance_
        * [.getModels(scopes, options)](#Client+getModels) ⇒ <code>Array.&lt;GraphandModel.constructor&gt;</code>
        * [.clone(options, login)](#Client+clone) ⇒ [<code>Client</code>](#Client)
        * [.getModel(scope, options)](#Client+getModel) ⇒ <code>GraphandModel.constructor</code>
    * _static_
        * [.createClient(options)](#Client.createClient) ⇒ [<code>Client</code>](#Client)


* * *

<a name="new_Client_new"></a>

### new Client(project, [options])
Graphand Client


| Param | Type | Description |
| --- | --- | --- |
| project | [<code>ClientOptions</code>](#ClientOptions) \| <code>string</code> | Your project _id or client options |
| [options] | [<code>ClientOptions</code>](#ClientOptions) | Client options |


* * *

<a name="Client+getModels"></a>

### client.getModels(scopes, options) ⇒ <code>Array.&lt;GraphandModel.constructor&gt;</code>
Get multiple models at once (multiple [getModel](#Client+getModel))

**Kind**: instance method of [<code>Client</code>](#Client)  

| Param | Type |
| --- | --- |
| scopes | <code>Array.&lt;string&gt;</code> | 
| options |  | 


* * *

<a name="Client+clone"></a>

### client.clone(options, login) ⇒ [<code>Client</code>](#Client)
Clone the current client

**Kind**: instance method of [<code>Client</code>](#Client)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | [<code>ClientOptions</code>](#ClientOptions) |  |  |
| login | <code>boolean</code> | <code>true</code> | Define if the cloned client inherits of its parent access & refresh token |


* * *

<a name="Client+getModel"></a>

### client.getModel(scope, options) ⇒ <code>GraphandModel.constructor</code>
Get ready-to-use model by scope. Use [getModels](#Client+getModels) to get multiple models at once

**Kind**: instance method of [<code>Client</code>](#Client)  

| Param | Type |
| --- | --- |
| scope | <code>string</code> | 
| options |  | 


* * *

<a name="Client.createClient"></a>

### Client.createClient(options) ⇒ [<code>Client</code>](#Client)
Create new client

**Kind**: static method of [<code>Client</code>](#Client)  

| Param | Type |
| --- | --- |
| options | [<code>ClientOptions</code>](#ClientOptions) | 


* * *

