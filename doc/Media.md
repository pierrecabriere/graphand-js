<a name="Media"></a>

## Media ⇐ [<code>GraphandModel</code>](#GraphandModel)
Media model. Use [client.getModel("Media")](#Client+getModel) to use this model

**Kind**: global class  
**Extends**: [<code>GraphandModel</code>](#GraphandModel)  

* [Media](#Media) ⇐ [<code>GraphandModel</code>](#GraphandModel)
    * [.raw](#GraphandModel+raw) ⇒ <code>\*</code>
    * [.getUrl(opts)](#Media+getUrl)
    * [.update(update, [options])](#GraphandModel+update)
    * [.delete([options])](#GraphandModel+delete)
    * [.clone(locale)](#GraphandModel+clone)
    * [.get(slug, [parse], _locale, fallback)](#GraphandModel+get)
    * [.set(slug, value, [upsert], [parse])](#GraphandModel+set)
    * [.assign(values, [upsert], updatedAtNow)](#GraphandModel+assign)
    * [.subscribe(callback)](#GraphandModel+subscribe)
    * [.isTemporary()](#GraphandModel+isTemporary)
    * [.serialize()](#GraphandModel+serialize) ⇒ <code>Object</code>
    * [.toJSON()](#GraphandModel+toJSON) ⇒ <code>Object</code>


* * *

<a name="GraphandModel+raw"></a>

### media.raw ⇒ <code>\*</code>
Returns raw data of instance

**Kind**: instance property of [<code>Media</code>](#Media)  

* * *

<a name="Media+getUrl"></a>

### media.getUrl(opts)
Get graphand cdn url for current media

**Kind**: instance method of [<code>Media</code>](#Media)  

| Param | Type |
| --- | --- |
| opts | [<code>MediaUrlOptions</code>](#MediaUrlOptions) | 


* * *

<a name="GraphandModel+update"></a>

### media.update(update, [options])
Update current instance

**Kind**: instance method of [<code>Media</code>](#Media)  

| Param | Type | Description |
| --- | --- | --- |
| update | [<code>Update</code>](#Update) | payload to apply. Query is already set with current instance id (ex: { set: { ... } }) |
| [options] |  |  |


* * *

<a name="GraphandModel+delete"></a>

### media.delete([options])
Delete current instance

**Kind**: instance method of [<code>Media</code>](#Media)  

| Param |
| --- |
| [options] | 


* * *

<a name="GraphandModel+clone"></a>

### media.clone(locale)
Clone the instance

**Kind**: instance method of [<code>Media</code>](#Media)  

| Param |
| --- |
| locale | 


* * *

<a name="GraphandModel+get"></a>

### media.get(slug, [parse], _locale, fallback)
Model instance getter. Returns the value for the specified key

**Kind**: instance method of [<code>Media</code>](#Media)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| slug | <code>string</code> |  | The key (field slug) to get |
| [parse] | <code>boolean</code> | <code>true</code> | Default true. If false returns raw value |
| _locale |  |  |  |
| fallback |  | <code>true</code> |  |


* * *

<a name="GraphandModel+set"></a>

### media.set(slug, value, [upsert], [parse])
Model instance setter. Set value for the specified key

**Kind**: instance method of [<code>Media</code>](#Media)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| slug | <code>string</code> |  | The key (field slug) to get |
| value | <code>\*</code> |  |  |
| [upsert] | <code>boolean</code> |  | Define if the setter will trigger a store upsert action |
| [parse] | <code>boolean</code> | <code>true</code> | Default true. If false set raw value |


* * *

<a name="GraphandModel+assign"></a>

### media.assign(values, [upsert], updatedAtNow)
Assign multiple values to instance.

**Kind**: instance method of [<code>Media</code>](#Media)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| values | <code>Object</code> |  |  |
| [upsert] | <code>boolean</code> | <code>true</code> | Define if the setter will trigger a store upsert action |
| updatedAtNow |  | <code>true</code> |  |


* * *

<a name="GraphandModel+subscribe"></a>

### media.subscribe(callback)
Subscribe to the current instance. The callback will be called each time the instance is updated in store.
If the model is synced (realtime), the callback will be called when the instance is updated via socket

**Kind**: instance method of [<code>Media</code>](#Media)  

| Param | Description |
| --- | --- |
| callback | The function to call when the instance is updated |


* * *

<a name="GraphandModel+isTemporary"></a>

### media.isTemporary()
Returns true if the current instance is only in memory and not persisted on Graphand.

**Kind**: instance method of [<code>Media</code>](#Media)  

* * *

<a name="GraphandModel+serialize"></a>

### media.serialize() ⇒ <code>Object</code>
Serialize instance. Serialized data could be hydrated with GraphandModel.hydrate

**Kind**: instance method of [<code>Media</code>](#Media)  

* * *

<a name="GraphandModel+toJSON"></a>

### media.toJSON() ⇒ <code>Object</code>
Returns JSON-serialized object of the current instance

**Kind**: instance method of [<code>Media</code>](#Media)  

* * *

