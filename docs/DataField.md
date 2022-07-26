<a name="DataField"></a>

## DataField ⇐ [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)
DataField model. Use [client.getModel("DataField")](Client.md#Client+getModel) to use this model

**Kind**: global class  
**Extends**: [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

* [DataField](DataField.md#DataField) ⇐ [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)
    * [.raw](#GraphandModel+raw) ⇒ <code>\*</code>
    * [.update(update, [options])](#GraphandModel+update)
    * [.delete([options])](#GraphandModel+delete)
    * [.clone(locale)](#GraphandModel+clone)
    * [.get(slug, [parse], _locale, fallback)](#GraphandModel+get)
    * [.set(slug, value, [upsert], [parse])](#GraphandModel+set)
    * [.assign(values, [upsert])](#GraphandModel+assign)
    * [.subscribe(callback)](#GraphandModel+subscribe)
    * [.isTemporary()](#GraphandModel+isTemporary)
    * [.serialize()](#GraphandModel+serialize) ⇒ <code>Object</code>
    * [.toJSON()](#GraphandModel+toJSON) ⇒ <code>Object</code>


* * *

<a name="GraphandModel+raw"></a>

### dataField.raw ⇒ <code>\*</code>
Returns raw data of instance

**Kind**: instance property of [<code>DataField</code>](DataField.md#DataField)  

* * *

<a name="GraphandModel+update"></a>

### dataField.update(update, [options])
Update current instance

**Kind**: instance method of [<code>DataField</code>](DataField.md#DataField)  

| Param | Type | Description |
| --- | --- | --- |
| update | [<code>Update</code>](typedef.md#Update) | payload to apply. Query is already set with current instance id |
| [options] |  |  |

**Example**  
```js
// set title toto on the current instance
this.update({ set: { ...payload } })
```

* * *

<a name="GraphandModel+delete"></a>

### dataField.delete([options])
Delete current instance

**Kind**: instance method of [<code>DataField</code>](DataField.md#DataField)  

| Param |
| --- |
| [options] | 

**Example**  
```js
this.delete().then(() => console.log("deleted"))
```

* * *

<a name="GraphandModel+clone"></a>

### dataField.clone(locale)
Clone the instance

**Kind**: instance method of [<code>DataField</code>](DataField.md#DataField)  

| Param |
| --- |
| locale | 


* * *

<a name="GraphandModel+get"></a>

### dataField.get(slug, [parse], _locale, fallback)
Model instance getter. Returns the value for the specified key

**Kind**: instance method of [<code>DataField</code>](DataField.md#DataField)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| slug | <code>string</code> |  | The key (field slug) to get |
| [parse] | <code>boolean</code> | <code>true</code> | Default true. If false returns raw value |
| _locale |  |  |  |
| fallback |  | <code>true</code> |  |


* * *

<a name="GraphandModel+set"></a>

### dataField.set(slug, value, [upsert], [parse])
Model instance setter. Set value for the specified key

**Kind**: instance method of [<code>DataField</code>](DataField.md#DataField)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| slug | <code>string</code> |  | The key (field slug) to get |
| value | <code>\*</code> |  |  |
| [upsert] | <code>boolean</code> |  | Define if the setter will trigger a store upsert action |
| [parse] | <code>boolean</code> | <code>true</code> | Default true. If false set raw value |


* * *

<a name="GraphandModel+assign"></a>

### dataField.assign(values, [upsert])
Assign multiple values to instance.

**Kind**: instance method of [<code>DataField</code>](DataField.md#DataField)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| values | <code>Object</code> |  |  |
| [upsert] | <code>boolean</code> | <code>true</code> | Define if the setter will trigger a store upsert action |


* * *

<a name="GraphandModel+subscribe"></a>

### dataField.subscribe(callback)
Subscribe to the current instance. The callback will be called each time the instance is updated in store.
If the model is synced (realtime), the callback will be called when the instance is updated via socket

**Kind**: instance method of [<code>DataField</code>](DataField.md#DataField)  

| Param | Description |
| --- | --- |
| callback | The function to call when the instance is updated |


* * *

<a name="GraphandModel+isTemporary"></a>

### dataField.isTemporary()
Returns true if the current instance is only in memory and not persisted on Graphand.

**Kind**: instance method of [<code>DataField</code>](DataField.md#DataField)  

* * *

<a name="GraphandModel+serialize"></a>

### dataField.serialize() ⇒ <code>Object</code>
Serialize instance. Serialized data could be hydrated with GraphandModel.hydrate

**Kind**: instance method of [<code>DataField</code>](DataField.md#DataField)  

* * *

<a name="GraphandModel+toJSON"></a>

### dataField.toJSON() ⇒ <code>Object</code>
Returns JSON-serialized object of the current instance

**Kind**: instance method of [<code>DataField</code>](DataField.md#DataField)  

* * *

