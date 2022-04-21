<a name="Restriction"></a>

## Restriction ⇐ [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)
Restriction model. Use [client.getModel("Restriction")](Client.md#Client+getModel) to use this model

**Kind**: global class  
**Extends**: [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)  

* [Restriction](Restriction.md#Restriction) ⇐ [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)
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

### restriction.raw ⇒ <code>\*</code>
Returns raw data of instance

**Kind**: instance property of [<code>Restriction</code>](Restriction.md#Restriction)  

* * *

<a name="GraphandModel+update"></a>

### restriction.update(update, [options])
Update current instance

**Kind**: instance method of [<code>Restriction</code>](Restriction.md#Restriction)  

| Param | Type | Description |
| --- | --- | --- |
| update | [<code>Update</code>](#Update) | payload to apply. Query is already set with current instance id (ex: { set: { ... } }) |
| [options] |  |  |


* * *

<a name="GraphandModel+delete"></a>

### restriction.delete([options])
Delete current instance

**Kind**: instance method of [<code>Restriction</code>](Restriction.md#Restriction)  

| Param |
| --- |
| [options] | 


* * *

<a name="GraphandModel+clone"></a>

### restriction.clone(locale)
Clone the instance

**Kind**: instance method of [<code>Restriction</code>](Restriction.md#Restriction)  

| Param |
| --- |
| locale | 


* * *

<a name="GraphandModel+get"></a>

### restriction.get(slug, [parse], _locale, fallback)
Model instance getter. Returns the value for the specified key

**Kind**: instance method of [<code>Restriction</code>](Restriction.md#Restriction)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| slug | <code>string</code> |  | The key (field slug) to get |
| [parse] | <code>boolean</code> | <code>true</code> | Default true. If false returns raw value |
| _locale |  |  |  |
| fallback |  | <code>true</code> |  |


* * *

<a name="GraphandModel+set"></a>

### restriction.set(slug, value, [upsert], [parse])
Model instance setter. Set value for the specified key

**Kind**: instance method of [<code>Restriction</code>](Restriction.md#Restriction)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| slug | <code>string</code> |  | The key (field slug) to get |
| value | <code>\*</code> |  |  |
| [upsert] | <code>boolean</code> |  | Define if the setter will trigger a store upsert action |
| [parse] | <code>boolean</code> | <code>true</code> | Default true. If false set raw value |


* * *

<a name="GraphandModel+assign"></a>

### restriction.assign(values, [upsert], updatedAtNow)
Assign multiple values to instance.

**Kind**: instance method of [<code>Restriction</code>](Restriction.md#Restriction)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| values | <code>Object</code> |  |  |
| [upsert] | <code>boolean</code> | <code>true</code> | Define if the setter will trigger a store upsert action |
| updatedAtNow |  | <code>true</code> |  |


* * *

<a name="GraphandModel+subscribe"></a>

### restriction.subscribe(callback)
Subscribe to the current instance. The callback will be called each time the instance is updated in store.
If the model is synced (realtime), the callback will be called when the instance is updated via socket

**Kind**: instance method of [<code>Restriction</code>](Restriction.md#Restriction)  

| Param | Description |
| --- | --- |
| callback | The function to call when the instance is updated |


* * *

<a name="GraphandModel+isTemporary"></a>

### restriction.isTemporary()
Returns true if the current instance is only in memory and not persisted on Graphand.

**Kind**: instance method of [<code>Restriction</code>](Restriction.md#Restriction)  

* * *

<a name="GraphandModel+serialize"></a>

### restriction.serialize() ⇒ <code>Object</code>
Serialize instance. Serialized data could be hydrated with GraphandModel.hydrate

**Kind**: instance method of [<code>Restriction</code>](Restriction.md#Restriction)  

* * *

<a name="GraphandModel+toJSON"></a>

### restriction.toJSON() ⇒ <code>Object</code>
Returns JSON-serialized object of the current instance

**Kind**: instance method of [<code>Restriction</code>](Restriction.md#Restriction)  

* * *
