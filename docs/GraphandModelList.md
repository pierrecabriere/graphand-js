<a name="GraphandModelList"></a>

## GraphandModelList
**Kind**: global class  

* [GraphandModelList](GraphandModelList.md#GraphandModelList)
    * _instance_
        * [.model](GraphandModelList.md#GraphandModelList+model) : [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)
        * [.query](GraphandModelList.md#GraphandModelList+query) : <code>any</code>
        * [.ids](GraphandModelList.md#GraphandModelList+ids) : <code>Array.&lt;string&gt;</code>
        * [.promise](GraphandModelList.md#GraphandModelList+promise) : <code>GraphandModelListPromise</code>
        * [.subscribe(callback)](GraphandModelList.md#GraphandModelList+subscribe)
        * [.serialize()](GraphandModelList.md#GraphandModelList+serialize) ⇒ <code>Object</code>
    * _static_
        * [.hydrate(data)](#GraphandModelList.hydrate) ⇒ [<code>GraphandModelList</code>](GraphandModelList.md#GraphandModelList)


* * *

<a name="GraphandModelList+model"></a>

### graphandModelList.model : [<code>GraphandModel</code>](GraphandModel.md#GraphandModel)
**Kind**: instance property of [<code>GraphandModelList</code>](GraphandModelList.md#GraphandModelList)  
**Access**: public  
**Read only**: true  

* * *

<a name="GraphandModelList+query"></a>

### graphandModelList.query : <code>any</code>
**Kind**: instance property of [<code>GraphandModelList</code>](GraphandModelList.md#GraphandModelList)  
**Access**: public  
**Read only**: true  

* * *

<a name="GraphandModelList+ids"></a>

### graphandModelList.ids : <code>Array.&lt;string&gt;</code>
**Kind**: instance property of [<code>GraphandModelList</code>](GraphandModelList.md#GraphandModelList)  
**Access**: public  
**Read only**: true  

* * *

<a name="GraphandModelList+promise"></a>

### graphandModelList.promise : <code>GraphandModelListPromise</code>
**Kind**: instance property of [<code>GraphandModelList</code>](GraphandModelList.md#GraphandModelList)  
**Access**: public  
**Read only**: true  

* * *

<a name="GraphandModelList+subscribe"></a>

### graphandModelList.subscribe(callback)
Subscribe to the list. The callback will be called each time (an instance inside) the list is updated in store.
If the model is synced (realtime), the callback will be called when the list is updated via socket

**Kind**: instance method of [<code>GraphandModelList</code>](GraphandModelList.md#GraphandModelList)  

| Param | Description |
| --- | --- |
| callback | The function to call when the list is updated |


* * *

<a name="GraphandModelList+serialize"></a>

### graphandModelList.serialize() ⇒ <code>Object</code>
Serialize list. Serialized data could be hydrated with GraphandModel.hydrate

**Kind**: instance method of [<code>GraphandModelList</code>](GraphandModelList.md#GraphandModelList)  

* * *

<a name="GraphandModelList.hydrate"></a>

### GraphandModelList.hydrate(data) ⇒ [<code>GraphandModelList</code>](GraphandModelList.md#GraphandModelList)
Hydrate GraphandModelList from serialized data

**Kind**: static method of [<code>GraphandModelList</code>](GraphandModelList.md#GraphandModelList)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>any</code> | Serialized data |


* * *

