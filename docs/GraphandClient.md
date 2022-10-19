<a name="GraphandClient"></a>

## GraphandClient
Base Graphand Client class

**Kind**: global class  

* [GraphandClient](GraphandClient.md#GraphandClient)
    * [new GraphandClient(project, [options])](#new_GraphandClient_new)
    * _instance_
        * [.getBaseURL()](GraphandClient.md#GraphandClient+getBaseURL) ⇒
        * [.getCdnURL()](GraphandClient.md#GraphandClient+getCdnURL) ⇒
        * [.getModels(scopes, options)](GraphandClient.md#GraphandClient+getModels) ⇒ <code>Array.&lt;GraphandModel.constructor&gt;</code>
        * [.getModel(scope, options)](GraphandClient.md#GraphandClient+getModel) ⇒ <code>GraphandModel.constructor</code>
        * [.reinit()](GraphandClient.md#GraphandClient+reinit)
        * [.logout()](GraphandClient.md#GraphandClient+logout)
        * [.login(credentials)](GraphandClient.md#GraphandClient+login)
        * [.clone(options, cloneTokens)](GraphandClient.md#GraphandClient+clone) ⇒ [<code>GraphandClient</code>](GraphandClient.md#GraphandClient)
        * [.destroy()](GraphandClient.md#GraphandClient+destroy)
    * _static_
        * [.createClient(options)](#GraphandClient.createClient) ⇒ [<code>GraphandClient</code>](GraphandClient.md#GraphandClient)


* * *

<a name="new_GraphandClient_new"></a>

### new GraphandClient(project, [options])
Graphand Client


| Param | Type | Description |
| --- | --- | --- |
| project | [<code>ClientOptions</code>](typedef.md#ClientOptions) \| <code>string</code> | Your project _id or client options |
| [options] | [<code>ClientOptions</code>](typedef.md#ClientOptions) | Client options |


* * *

<a name="GraphandClient+getBaseURL"></a>

### graphandClient.getBaseURL() ⇒
Get base URL for ajax calls

**Kind**: instance method of [<code>GraphandClient</code>](GraphandClient.md#GraphandClient)  
**Returns**: string  

* * *

<a name="GraphandClient+getCdnURL"></a>

### graphandClient.getCdnURL() ⇒
Get cdn URL

**Kind**: instance method of [<code>GraphandClient</code>](GraphandClient.md#GraphandClient)  
**Returns**: string  

* * *

<a name="GraphandClient+getModels"></a>

### graphandClient.getModels(scopes, options) ⇒ <code>Array.&lt;GraphandModel.constructor&gt;</code>
Get multiple models at once (multiple [getModel](GraphandClient.md#GraphandClient+getModel))

**Kind**: instance method of [<code>GraphandClient</code>](GraphandClient.md#GraphandClient)  

| Param | Type |
| --- | --- |
| scopes | [<code>Array.&lt;ModelScopes&gt;</code>](typedef.md#ModelScopes) \| <code>&quot;Data:\*&quot;</code> | 
| options |  | 


* * *

<a name="GraphandClient+getModel"></a>

### graphandClient.getModel(scope, options) ⇒ <code>GraphandModel.constructor</code>
Get ready-to-use model by scope. Use [getModels](GraphandClient.md#GraphandClient+getModels) to get multiple models at once

**Kind**: instance method of [<code>GraphandClient</code>](GraphandClient.md#GraphandClient)  

| Param | Type |
| --- | --- |
| scope | [<code>ModelScopes</code>](typedef.md#ModelScopes) \| <code>&quot;Data:\*&quot;</code> | 
| options |  | 


* * *

<a name="GraphandClient+reinit"></a>

### graphandClient.reinit()
Reinit current client (reinit models)

**Kind**: instance method of [<code>GraphandClient</code>](GraphandClient.md#GraphandClient)  

* * *

<a name="GraphandClient+logout"></a>

### graphandClient.logout()
Reset access and refresh tokens and reinit client

**Kind**: instance method of [<code>GraphandClient</code>](GraphandClient.md#GraphandClient)  

* * *

<a name="GraphandClient+login"></a>

### graphandClient.login(credentials)
Login account with credentials and set access and refresh tokens in current client

**Kind**: instance method of [<code>GraphandClient</code>](GraphandClient.md#GraphandClient)  

| Param |
| --- |
| credentials | 


* * *

<a name="GraphandClient+clone"></a>

### graphandClient.clone(options, cloneTokens) ⇒ [<code>GraphandClient</code>](GraphandClient.md#GraphandClient)
Clone the current client

**Kind**: instance method of [<code>GraphandClient</code>](GraphandClient.md#GraphandClient)  

| Param | Type | Description |
| --- | --- | --- |
| options | [<code>ClientOptions</code>](typedef.md#ClientOptions) |  |
| cloneTokens | <code>boolean</code> | Define if the cloned client inherits of its parent access & refresh token |


* * *

<a name="GraphandClient+destroy"></a>

### graphandClient.destroy()
Destroy the current client

**Kind**: instance method of [<code>GraphandClient</code>](GraphandClient.md#GraphandClient)  

* * *

<a name="GraphandClient.createClient"></a>

### GraphandClient.createClient(options) ⇒ [<code>GraphandClient</code>](GraphandClient.md#GraphandClient)
Create new client

**Kind**: static method of [<code>GraphandClient</code>](GraphandClient.md#GraphandClient)  

| Param | Type |
| --- | --- |
| options | [<code>ClientOptions</code>](typedef.md#ClientOptions) | 


* * *

