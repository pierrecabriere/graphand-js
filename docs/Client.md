<a name="Client"></a>

## Client
Base Graphand Client class

**Kind**: global class  

* [Client](Client.md#Client)
    * [new Client(project, [options])](#new_Client_new)
    * _instance_
        * [.getModels(scopes, options)](Client.md#Client+getModels) ⇒ <code>Array.&lt;GraphandModel.constructor&gt;</code>
        * [.getModel(scope, options)](Client.md#Client+getModel) ⇒ <code>GraphandModel.constructor</code>
        * [.reinit()](Client.md#Client+reinit)
        * [.logout()](Client.md#Client+logout)
        * [.login(credentials)](Client.md#Client+login)
        * [.clone(options, cloneTokens)](Client.md#Client+clone) ⇒ [<code>Client</code>](Client.md#Client)
        * [.detroy()](Client.md#Client+detroy)
    * _static_
        * [.createClient(options)](#Client.createClient) ⇒ [<code>Client</code>](Client.md#Client)


* * *

<a name="new_Client_new"></a>

### new Client(project, [options])
Graphand Client


| Param | Type | Description |
| --- | --- | --- |
| project | [<code>ClientOptions</code>](typedef.md#ClientOptions) \| <code>string</code> | Your project _id or client options |
| [options] | [<code>ClientOptions</code>](typedef.md#ClientOptions) | Client options |


* * *

<a name="Client+getModels"></a>

### client.getModels(scopes, options) ⇒ <code>Array.&lt;GraphandModel.constructor&gt;</code>
Get multiple models at once (multiple [getModel](Client.md#Client+getModel))

**Kind**: instance method of [<code>Client</code>](Client.md#Client)  

| Param | Type |
| --- | --- |
| scopes | [<code>Array.&lt;ModelScopes&gt;</code>](typedef.md#ModelScopes) \| <code>&quot;Data:\*&quot;</code> | 
| options |  | 


* * *

<a name="Client+getModel"></a>

### client.getModel(scope, options) ⇒ <code>GraphandModel.constructor</code>
Get ready-to-use model by scope. Use [getModels](Client.md#Client+getModels) to get multiple models at once

**Kind**: instance method of [<code>Client</code>](Client.md#Client)  

| Param | Type |
| --- | --- |
| scope | [<code>ModelScopes</code>](typedef.md#ModelScopes) \| <code>&quot;Data:\*&quot;</code> | 
| options |  | 


* * *

<a name="Client+reinit"></a>

### client.reinit()
Reinit current client (reinit models)

**Kind**: instance method of [<code>Client</code>](Client.md#Client)  

* * *

<a name="Client+logout"></a>

### client.logout()
Reset access and refresh tokens and reinit client

**Kind**: instance method of [<code>Client</code>](Client.md#Client)  

* * *

<a name="Client+login"></a>

### client.login(credentials)
Login account with credentials and set access and refresh tokens in current client

**Kind**: instance method of [<code>Client</code>](Client.md#Client)  

| Param |
| --- |
| credentials | 


* * *

<a name="Client+clone"></a>

### client.clone(options, cloneTokens) ⇒ [<code>Client</code>](Client.md#Client)
Clone the current client

**Kind**: instance method of [<code>Client</code>](Client.md#Client)  

| Param | Type | Description |
| --- | --- | --- |
| options | [<code>ClientOptions</code>](typedef.md#ClientOptions) |  |
| cloneTokens | <code>boolean</code> | Define if the cloned client inherits of its parent access & refresh token |


* * *

<a name="Client+detroy"></a>

### client.detroy()
Destroy the current client

**Kind**: instance method of [<code>Client</code>](Client.md#Client)  

* * *

<a name="Client.createClient"></a>

### Client.createClient(options) ⇒ [<code>Client</code>](Client.md#Client)
Create new client

**Kind**: static method of [<code>Client</code>](Client.md#Client)  

| Param | Type |
| --- | --- |
| options | [<code>ClientOptions</code>](typedef.md#ClientOptions) | 


* * *

