<a name="GraphandModelList"></a>

## GraphandModelList
**Kind**: global class  

* [GraphandModelList](#GraphandModelList)
    * _instance_
        * [.subscribe(callback)](#GraphandModelList+subscribe)
        * [.serialize()](#GraphandModelList+serialize) ⇒ <code>Object</code>
    * _static_
        * [.hydrate(data)](#GraphandModelList.hydrate) ⇒ [<code>GraphandModelList</code>](#GraphandModelList)


* * *

<a name="GraphandModelList+subscribe"></a>

### graphandModelList.subscribe(callback)
Subscribe to the list. The callback will be called each time (an instance inside) the list is updated in store.
If the model is synced (realtime), the callback will be called when the list is updated via socket

**Kind**: instance method of [<code>GraphandModelList</code>](#GraphandModelList)  

| Param | Description |
| --- | --- |
| callback | The function to call when the instance is updated |


* * *

<a name="GraphandModelList+serialize"></a>

### graphandModelList.serialize() ⇒ <code>Object</code>
Serialize list. Serialized data could be hydrated with GraphandModel.hydrate

**Kind**: instance method of [<code>GraphandModelList</code>](#GraphandModelList)  

* * *

<a name="GraphandModelList.hydrate"></a>

### GraphandModelList.hydrate(data) ⇒ [<code>GraphandModelList</code>](#GraphandModelList)
Hydrate GraphandModelList from serialized data

**Kind**: static method of [<code>GraphandModelList</code>](#GraphandModelList)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>any</code> | Serialized data |


* * *

