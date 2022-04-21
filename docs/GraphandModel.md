<a name="GraphandModel"></a>

## GraphandModel
Base GraphandModel class. You can create your own custom models by extending this class.

**Kind**: global class  

* [GraphandModel](GraphandModel.md#GraphandModel)
    * [new GraphandModel(data)](#new_GraphandModel_new)
    * _instance_
        * [.raw](GraphandModel.md#GraphandModel+raw) ⇒ <code>\*</code>
        * [.update(update, [options])](GraphandModel.md#GraphandModel+update)
        * [.delete([options])](GraphandModel.md#GraphandModel+delete)
        * [.clone(locale)](GraphandModel.md#GraphandModel+clone)
        * [.get(slug, [parse], _locale, fallback)](GraphandModel.md#GraphandModel+get)
        * [.set(slug, value, [upsert], [parse])](GraphandModel.md#GraphandModel+set)
        * [.assign(values, [upsert], updatedAtNow)](GraphandModel.md#GraphandModel+assign)
        * [.subscribe(callback)](GraphandModel.md#GraphandModel+subscribe)
        * [.isTemporary()](GraphandModel.md#GraphandModel+isTemporary)
        * [.serialize()](GraphandModel.md#GraphandModel+serialize) ⇒ <code>Object</code>
        * [.toJSON()](GraphandModel.md#GraphandModel+toJSON) ⇒ <code>Object</code>
    * _static_
        * [.dataFieldsList](#GraphandModel.dataFieldsList) : [<code>GraphandModelList</code>](GraphandModelList.md#GraphandModelList)
        * [.hydrate(data, upsert)](#GraphandModel.hydrate) ⇒ [<code>GraphandModel</code>](GraphandModel.md#GraphandModel) \| [<code>GraphandModelList</code>](GraphandModelList.md#GraphandModelList)
        * [.sync(opts)](#GraphandModel.sync)
            * [.handleSocketTrigger](#GraphandModel.sync.handleSocketTrigger) ⇒ <code>boolean</code> \| <code>void</code>
        * [.get(query, opts)](#GraphandModel.get) ⇒ [<code>GraphandModel</code>](GraphandModel.md#GraphandModel) \| <code>GraphandModelPromise</code>
        * [.getFields([cache])](#GraphandModel.getFields) ⇒ <code>Object</code>
        * [.customField(slug, field)](#GraphandModel.customField)
        * [.customFields(fields)](#GraphandModel.customFields)
        * [.on(event, handler, options)](#GraphandModel.on)
        * [.reinit()](#GraphandModel.reinit)
        * [.clearCache(query, clean)](#GraphandModel.clearCache)
        * [.getList(query, opts)](#GraphandModel.getList) ⇒ [<code>GraphandModelList</code>](GraphandModelList.md#GraphandModelList) \| <code>GraphandModelListPromise</code>
        * [.count(query)](#GraphandModel.count) ⇒ <code>number</code>
        * [.create(payload, hooks)](#GraphandModel.create) ⇒ [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)
        * [.update(update, [options])](#GraphandModel.update)
        * [.delete(del, [options])](#GraphandModel.delete)
        * [.execHook(event, args)](#GraphandModel.execHook) ⇒ <code>Promise.&lt;Array.&lt;any&gt;&gt;</code>
        * [.hook(event, callback)](#GraphandModel.hook)


* * *

<a name="new_GraphandModel_new"></a>

### new GraphandModel(data)
Create a new instance of GraphandModel. If getting an instance as data, the instance will be cloned


| Param | Type |
| --- | --- |
| data | <code>\*</code> | 


* * *

<a name="GraphandModel+raw"></a>

### graphandModel.raw ⇒ <code>\*</code>
Returns raw data of instance

**Kind**: instance property of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

* * *

<a name="GraphandModel+update"></a>

### graphandModel.update(update, [options])
Update current instance

**Kind**: instance method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Description |
| --- | --- | --- |
| update | [<code>Update</code>](#Update) | payload to apply. Query is already set with current instance id |
| [options] |  |  |

**Example**  
```js
// set title toto on the current instance
instance.update({ set: { title: "toto" } })
```

* * *

<a name="GraphandModel+delete"></a>

### graphandModel.delete([options])
Delete current instance

**Kind**: instance method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param |
| --- |
| [options] | 

**Example**  
```js
instance.delete().then(() => console.log("deleted"))
```

* * *

<a name="GraphandModel+clone"></a>

### graphandModel.clone(locale)
Clone the instance

**Kind**: instance method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param |
| --- |
| locale | 


* * *

<a name="GraphandModel+get"></a>

### graphandModel.get(slug, [parse], _locale, fallback)
Model instance getter. Returns the value for the specified key

**Kind**: instance method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| slug | <code>string</code> |  | The key (field slug) to get |
| [parse] | <code>boolean</code> | <code>true</code> | Default true. If false returns raw value |
| _locale |  |  |  |
| fallback |  | <code>true</code> |  |


* * *

<a name="GraphandModel+set"></a>

### graphandModel.set(slug, value, [upsert], [parse])
Model instance setter. Set value for the specified key

**Kind**: instance method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| slug | <code>string</code> |  | The key (field slug) to get |
| value | <code>\*</code> |  |  |
| [upsert] | <code>boolean</code> |  | Define if the setter will trigger a store upsert action |
| [parse] | <code>boolean</code> | <code>true</code> | Default true. If false set raw value |


* * *

<a name="GraphandModel+assign"></a>

### graphandModel.assign(values, [upsert], updatedAtNow)
Assign multiple values to instance.

**Kind**: instance method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| values | <code>Object</code> |  |  |
| [upsert] | <code>boolean</code> | <code>true</code> | Define if the setter will trigger a store upsert action |
| updatedAtNow |  | <code>true</code> |  |


* * *

<a name="GraphandModel+subscribe"></a>

### graphandModel.subscribe(callback)
Subscribe to the current instance. The callback will be called each time the instance is updated in store.
If the model is synced (realtime), the callback will be called when the instance is updated via socket

**Kind**: instance method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Description |
| --- | --- |
| callback | The function to call when the instance is updated |


* * *

<a name="GraphandModel+isTemporary"></a>

### graphandModel.isTemporary()
Returns true if the current instance is only in memory and not persisted on Graphand.

**Kind**: instance method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

* * *

<a name="GraphandModel+serialize"></a>

### graphandModel.serialize() ⇒ <code>Object</code>
Serialize instance. Serialized data could be hydrated with GraphandModel.hydrate

**Kind**: instance method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

* * *

<a name="GraphandModel+toJSON"></a>

### graphandModel.toJSON() ⇒ <code>Object</code>
Returns JSON-serialized object of the current instance

**Kind**: instance method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

* * *

<a name="GraphandModel.dataFieldsList"></a>

### GraphandModel.dataFieldsList : [<code>GraphandModelList</code>](GraphandModelList.md#GraphandModelList)
Returns the DataField list of the model

**Kind**: static property of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

* * *

<a name="GraphandModel.hydrate"></a>

### GraphandModel.hydrate(data, upsert) ⇒ [<code>GraphandModel</code>](GraphandModel.md#GraphandModel) \| [<code>GraphandModelList</code>](GraphandModelList.md#GraphandModelList)
Hydrate GraphandModel or GraphandModelList from serialized data

**Kind**: static method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>any</code> | Serialized data |
| upsert | <code>boolean</code> | Upsert hydrated data in store |


* * *

<a name="GraphandModel.sync"></a>

### GraphandModel.sync(opts)
Sync the current Model with the client socket

**Kind**: static method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.handleSocketTrigger | [<code>handleSocketTrigger</code>](#GraphandModel.sync.handleSocketTrigger) | middleware to allow or disallow the model to proceed data when receiving on socket |
| opts.force | <code>boolean</code> | force Model to resubscribe on socket (even if already subscribed) |


* * *

<a name="GraphandModel.sync.handleSocketTrigger"></a>

#### sync.handleSocketTrigger ⇒ <code>boolean</code> \| <code>void</code>
Description of the function

**Kind**: static typedef of [<code>sync</code>](#GraphandModel.sync)  
**Params**: opts {Object}  

| Param | Type | Description |
| --- | --- | --- |
| opts.action | <code>string</code> | Action |
| opts.payload | <code>string</code> | Payload |


* * *

<a name="GraphandModel.get"></a>

### GraphandModel.get(query, opts) ⇒ [<code>GraphandModel</code>](GraphandModel.md#GraphandModel) \| <code>GraphandModelPromise</code>
Returns a GraphandModel (or Promise) of the model

**Kind**: static method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> \| [<code>Query</code>](#Query) | the requested _id or the request query (see api doc) |
| opts |  |  |


* * *

<a name="GraphandModel.getFields"></a>

### GraphandModel.getFields([cache]) ⇒ <code>Object</code>
Get the real model schema fields (custom + system + data)

**Kind**: static method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [cache] | <code>boolean</code> | <code>true</code> | Default true. Returns cached fields |


* * *

<a name="GraphandModel.customField"></a>

### GraphandModel.customField(slug, field)
Add a custom field to Model

**Kind**: static method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Description |
| --- | --- | --- |
| slug | <code>string</code> | The field identifier |
| field | <code>GraphandField</code> | The GraphandField instance |


* * *

<a name="GraphandModel.customFields"></a>

### GraphandModel.customFields(fields)
Add multiple customFields

**Kind**: static method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Description |
| --- | --- | --- |
| fields | <code>Object.&lt;string, number&gt;</code> | example: { customField: new GraphandFieldText() } |


* * *

<a name="GraphandModel.on"></a>

### GraphandModel.on(event, handler, options)
[admin only] Register a new sockethook on the model. The host that register the sockethook needs to keep connection with graphand. Use [GraphandModel#on](GraphandModel#on) for example in a node.js script

**Kind**: static method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>&quot;before\_create&quot;</code> \| <code>&quot;after\_create&quot;</code> \| <code>&quot;before\_update&quot;</code> \| <code>&quot;after\_update&quot;</code> \| <code>&quot;before\_delete&quot;</code> \| <code>&quot;after\_delete&quot;</code> \| <code>&quot;before\_execute&quot;</code> \| <code>&quot;after\_execute&quot;</code> \| <code>&quot;before\_login&quot;</code> \| <code>&quot;after\_login&quot;</code> \| <code>&quot;before\_register&quot;</code> \| <code>&quot;after\_register&quot;</code> | The event that will trigger the sockethook |
| handler | [<code>GraphandModelHookHandler</code>](#GraphandModelHookHandler) | The handler that will be executed |
| options |  |  |


* * *

<a name="GraphandModel.reinit"></a>

### GraphandModel.reinit()
Reinitialize the model (clear cache & empty store)

**Kind**: static method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

* * *

<a name="GraphandModel.clearCache"></a>

### GraphandModel.clearCache(query, clean)
Clear the local cache for the model

**Kind**: static method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| query | <code>any</code> |  | If specified, clear only the cache for this query |
| clean | <code>boolean</code> | <code>false</code> | Default false. If true, the local model store will be reinitialized |


* * *

<a name="GraphandModel.getList"></a>

### GraphandModel.getList(query, opts) ⇒ [<code>GraphandModelList</code>](GraphandModelList.md#GraphandModelList) \| <code>GraphandModelListPromise</code>
Returns a GraphandModelList (or Promise) of the model

**Kind**: static method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Description |
| --- | --- | --- |
| query | [<code>Query</code>](#Query) | the request query (see api doc) |
| opts |  |  |

**Example**  
```js
GraphandModel.getList({ query: { title: { $regex: "toto" } }, pageSize: 5, page: 2 })
```

* * *

<a name="GraphandModel.count"></a>

### GraphandModel.count(query) ⇒ <code>number</code>
Returns a Promise that resolves the number of results for the given query

**Kind**: static method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Description |
| --- | --- | --- |
| query | [<code>Query</code>](#Query) | the request query (see api doc) |

**Example**  
```js
GraphandModel.count({ query: { title: { $regex: "toto" } } })
```

* * *

<a name="GraphandModel.create"></a>

### GraphandModel.create(payload, hooks) ⇒ [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)
Create and persist a new instance of the model

**Kind**: static method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| payload | <code>Object</code> \| <code>Array.&lt;Object&gt;</code> |  | The payload to persist in a new instance. You can profite an array to create multiple instances |
| hooks | <code>boolean</code> | <code>true</code> | Enable or disable hooks, default true |

**Example**  
```js
GraphandModel.create({ title: "toto" })
```

* * *

<a name="GraphandModel.update"></a>

### GraphandModel.update(update, [options])
Update one or multiple instances by query

**Kind**: static method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Description |
| --- | --- | --- |
| update | [<code>Update</code>](#Update) | query and payload to apply |
| [options] |  |  |

**Example**  
```js
// set title toto on every instance in the query scope
GraphandModel.create({ query: { title: { $ne: "toto" } }, set: { title: "toto" } })
```

* * *

<a name="GraphandModel.delete"></a>

### GraphandModel.delete(del, [options])
Delete one or multiple instances by query

**Kind**: static method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Description |
| --- | --- | --- |
| del | [<code>GraphandModel</code>](GraphandModel.md#GraphandModel) \| [<code>Query</code>](#Query) | query of target instances to delete (ex: { query: { ... } }) |
| [options] |  |  |

**Example**  
```js
GraphandModel.delete({ query: { title: { $ne: "toto" } } })
```

* * *

<a name="GraphandModel.execHook"></a>

### GraphandModel.execHook(event, args) ⇒ <code>Promise.&lt;Array.&lt;any&gt;&gt;</code>
Execute all hooks for an event. Returns an array of the reponses of each hook callback.

**Kind**: static method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>&quot;preCreate&quot;</code> \| <code>&quot;postCreate&quot;</code> \| <code>&quot;preUpdate&quot;</code> \| <code>&quot;postUpdate&quot;</code> \| <code>&quot;preDelete&quot;</code> \| <code>&quot;postDelete&quot;</code> | The event to execute. Graphand plugins can also implements new events |
| args | <code>any</code> | Args passed to the callbacks functions |


* * *

<a name="GraphandModel.hook"></a>

### GraphandModel.hook(event, callback)
Add hook on model

**Kind**: static method of [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>&quot;preCreate&quot;</code> \| <code>&quot;postCreate&quot;</code> \| <code>&quot;preUpdate&quot;</code> \| <code>&quot;postUpdate&quot;</code> \| <code>&quot;preDelete&quot;</code> \| <code>&quot;postDelete&quot;</code> | The event to listen. Graphand plugins can also implements new events |
| callback |  |  |


* * *

