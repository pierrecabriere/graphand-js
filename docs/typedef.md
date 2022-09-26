## Typedefs

<dl>
<dt><a href="typedef.md#ClientOptions">ClientOptions</a></dt>
<dd><p>Graphand client options</p>
</dd>
<dt><a href="typedef.md#GraphandModelHookHandler">GraphandModelHookHandler</a> ⇒ <code>*</code> | <code>void</code></dt>
<dd></dd>
<dt><a href="typedef.md#Query">Query</a></dt>
<dd><p>Model fetching options</p>
</dd>
<dt><a href="typedef.md#Update">Update</a></dt>
<dd><p>Model updating options for <a href="GraphandModel#update">GraphandModel#update</a></p>
</dd>
<dt><a href="typedef.md#FetchOptions">FetchOptions</a></dt>
<dd><p>Model fetching options</p>
</dd>
<dt><a href="typedef.md#ModelScopes">ModelScopes</a></dt>
<dd><p>Model fetching options</p>
</dd>
<dt><a href="typedef.md#ModelListOptions">ModelListOptions</a></dt>
<dd><p>Model getList options</p>
</dd>
<dt><a href="typedef.md#MediaUrlOptions">MediaUrlOptions</a></dt>
<dd><p><a href="Media#getUrl">Media#getUrl</a> options</p>
</dd>
</dl>

<a name="ClientOptions"></a>

## ClientOptions
Graphand client options

**Kind**: global typedef  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| [host] | <code>string</code> | <code>&quot;\&quot;api.graphand.io\&quot;&quot;</code> |  |
| [cdn] | <code>string</code> | <code>&quot;\&quot;cdn.graphand.io\&quot;&quot;</code> |  |
| [ssl] | <code>boolean</code> | <code>true</code> |  |
| project | <code>string</code> |  | The project id to query on |
| accessToken | <code>string</code> |  | The initial access token |
| refreshToken | <code>string</code> |  | The initial refresh token, |
| locale | <code>string</code> |  |  |
| translations | <code>Array.&lt;string&gt;</code> |  |  |
| realtime | <code>boolean</code> |  | Connect client to the socket |
| [mergeQueries] | <code>boolean</code> | <code>true</code> | Automatically merge queries when querying by _id or ids |
| [autoSync] | <code>boolean</code> | <code>false</code> | Automatically sync all registered models with the socket |
| [subscribeFields] | <code>boolean</code> | <code>false</code> | Subscribe to DataFields |
| [init] | <code>boolean</code> | <code>false</code> | Initialize client at startup |
| [initProject] | <code>boolean</code> | <code>false</code> | Initialize project on construct (not needed if you don't need to use the Project model instance) |
| [initModels] | <code>boolean</code> | <code>false</code> | Automatically init all DataModels at startup |
| models | <code>\*</code> |  | : [] |
| [cache] | <code>boolean</code> | <code>true</code> | Cache queries |
| plugins | <code>\*</code> |  | : [] |
| socketOptions | <code>\*</code> |  |  |
| [env] | <code>string</code> | <code>&quot;\&quot;master\&quot;&quot;</code> | Graphand environment to query on |


* * *

<a name="GraphandModelHookHandler"></a>

## GraphandModelHookHandler ⇒ <code>\*</code> \| <code>void</code>
**Kind**: global typedef  
**Params**: payload {Object} - The payload sent by the server  

| Param | Type | Description |
| --- | --- | --- |
| resolve | <code>string</code> | Callback to resolve the handler and validate the sockethook workflow |
| reject | <code>string</code> | Callback to reject the handler and put error in the sockethook workflow |


* * *

<a name="Query"></a>

## Query
Model fetching options

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [query] | <code>Object</code> | A mongo query, cf. graphand API documentation |
| [ids] | <code>Array.&lt;string&gt;</code> | A list of ids to query |
| [sort] | <code>string</code> \| <code>Object</code> |  |
| [page] | <code>number</code> |  |
| [pageSize] | <code>number</code> |  |
| [populate] | <code>string</code> \| <code>Object</code> |  |


* * *

<a name="Update"></a>

## Update
Model updating options for [GraphandModel#update](GraphandModel#update)

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [query] | <code>Object</code> | A mongo query, cf. graphand API documentation |
| [ids] | <code>Array.&lt;string&gt;</code> | A list of ids to query |
| [sort] | <code>string</code> \| <code>Object</code> |  |
| [page] | <code>number</code> |  |
| [pageSize] | <code>number</code> |  |
| [populate] | <code>string</code> \| <code>Object</code> |  |
| [set] | <code>Object</code> | The payload to apply on target instances |


* * *

<a name="FetchOptions"></a>

## FetchOptions
Model fetching options

**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| cache | <code>boolean</code> | 
| hooks | <code>boolean</code> | 
| authToken | <code>string</code> | 
| global | <code>boolean</code> | 
| axiosOpts | <code>AxiosRequestConfig</code> | 


* * *

<a name="ModelScopes"></a>

## ModelScopes
Model fetching options

**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| scope | <code>&quot;Account&quot;</code> \| <code>&quot;Aggregation&quot;</code> \| <code>&quot;DataField&quot;</code> \| <code>&quot;DataModel&quot;</code> \| <code>&quot;Environment&quot;</code> \| <code>&quot;EsMapping&quot;</code> \| <code>&quot;Log&quot;</code> \| <code>&quot;Media&quot;</code> \| <code>&quot;Module&quot;</code> \| <code>&quot;Project&quot;</code> \| <code>&quot;Restriction&quot;</code> \| <code>&quot;Role&quot;</code> \| <code>&quot;Rule&quot;</code> \| <code>&quot;Sockethook&quot;</code> \| <code>&quot;Token&quot;</code> \| <code>&quot;User&quot;</code> \| <code>&quot;Webhook&quot;</code> | 


* * *

<a name="ModelListOptions"></a>

## ModelListOptions
Model getList options

**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| fetch | [<code>FetchOptions</code>](typedef.md#FetchOptions) \| <code>boolean</code> | 
| cache | <code>boolean</code> | 


* * *

<a name="MediaUrlOptions"></a>

## MediaUrlOptions
[Media#getUrl](Media#getUrl) options

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [w] | <code>number</code> | Image width |
| [h] | <code>number</code> | Image height |
| [fit] | <code>string</code> | Image fit (cover|contain) |
| [stream] | <code>string</code> | The mimetype to stream the media (need support for buffering) |


* * *

