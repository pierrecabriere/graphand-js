<a name="Log"></a>

## Log ⇐ [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)
Log model. Use [client.getModel("Log")](Client.md#Client+getModel) to use this model

**Kind**: global class  
**Extends**: [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

* [Log](Log.md#Log) ⇐ [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)
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


* * *

<a name="GraphandModel+raw"></a>

### log.raw ⇒ <code>\*</code>
Returns raw data of instance

**Kind**: instance property of [<code>Log</code>](Log.md#Log)  

* * *

<a name="GraphandModel+update"></a>

### log.update(update, [options])
Update current instance

**Kind**: instance method of [<code>Log</code>](Log.md#Log)  

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

### log.delete([options])
Delete current instance

**Kind**: instance method of [<code>Log</code>](Log.md#Log)  

| Param |
| --- |
| [options] | 

**Example**  
```js
instance.delete().then(() => console.log("deleted"))
```

* * *

<a name="GraphandModel+clone"></a>

### log.clone(locale)
Clone the instance

**Kind**: instance method of [<code>Log</code>](Log.md#Log)  

| Param |
| --- |
| locale | 


* * *

<a name="GraphandModel+get"></a>

### log.get(slug, [parse], _locale, fallback)
Model instance getter. Returns the value for the specified key

**Kind**: instance method of [<code>Log</code>](Log.md#Log)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| slug | <code>string</code> |  | The key (field slug) to get |
| [parse] | <code>boolean</code> | <code>true</code> | Default true. If false returns raw value |
| _locale |  |  |  |
| fallback |  | <code>true</code> |  |


* * *

<a name="GraphandModel+set"></a>

### log.set(slug, value, [upsert], [parse])
Model instance setter. Set value for the specified key

**Kind**: instance method of [<code>Log</code>](Log.md#Log)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| slug | <code>string</code> |  | The key (field slug) to get |
| value | <code>\*</code> |  |  |
| [upsert] | <code>boolean</code> |  | Define if the setter will trigger a store upsert action |
| [parse] | <code>boolean</code> | <code>true</code> | Default true. If false set raw value |


* * *

<a name="GraphandModel+assign"></a>

### log.assign(values, [upsert], updatedAtNow)
Assign multiple values to instance.

**Kind**: instance method of [<code>Log</code>](Log.md#Log)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| values | <code>Object</code> |  |  |
| [upsert] | <code>boolean</code> | <code>true</code> | Define if the setter will trigger a store upsert action |
| updatedAtNow |  | <code>true</code> |  |


* * *

<a name="GraphandModel+subscribe"></a>

### log.subscribe(callback)
Subscribe to the current instance. The callback will be called each time the instance is updated in store.
If the model is synced (realtime), the callback will be called when the instance is updated via socket

**Kind**: instance method of [<code>Log</code>](Log.md#Log)  

| Param | Description |
| --- | --- |
| callback | The function to call when the instance is updated |


* * *

<a name="GraphandModel+isTemporary"></a>

### log.isTemporary()
Returns true if the current instance is only in memory and not persisted on Graphand.

**Kind**: instance method of [<code>Log</code>](Log.md#Log)  

* * *

<a name="GraphandModel+serialize"></a>

### log.serialize() ⇒ <code>Object</code>
Serialize instance. Serialized data could be hydrated with GraphandModel.hydrate

**Kind**: instance method of [<code>Log</code>](Log.md#Log)  

* * *

<a name="GraphandModel+toJSON"></a>

### log.toJSON() ⇒ <code>Object</code>
Returns JSON-serialized object of the current instance

**Kind**: instance method of [<code>Log</code>](Log.md#Log)  

* * *

