# async-namespace library

async-namespace is a library to make multithreading in JavaScript easy. It is only available on the web. async-namespace offers high flexibility.

# Documentation

To instantly jump to the examples, press [here](#examples).

## Table of contents
* [The `asyncNamespace` function](#asyncnamespace)
    1. [Parameters](#asyncnamespace-parameters)
    2. [Example](#asyncnamespace-example)
* [The `fn` callback function](#fn)
    1. [Arguments](#fn-arguments)
    2. [Example](#fn-example)
* [The `runAsync` function](#runasync)
    1. [Parameters](#runasync-parameters)
    2. [Return value](#runasync-return)
    3. [Causes for `onreject`](#runasync-causes)
* [Examples](#examples)
* [Error examples](#error-examples)

Just include the files in your HTML via a script tag, and you get access to the global `asyncNamespace` function.

<a name="asyncnamespace"></a>
## asyncNamespace

<a name="asyncnamespace-parameters"></a>
### Parameters

Name | Type | Optional | Default | Use
--- | --- | --- | --- | --- 
fn | [Function](https://developer.mozilla.org/en-US/docs/Glossary/Function) | no | *void* | This function will have access to the function to execute code in other threads.
threads | [Number](https://developer.mozilla.org/en-US/docs/Glossary/Number) | yes |   [navigator.hardwareConcurrency](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorConcurrentHardware/hardwareConcurrency) |  Specifies how many threads will be generated. Usally, the default value is sufficient.You can call the values as different parameters or as object.

<a name="asyncnamespace-example"></a>
### Example

```javascript
// These are identical
asyncNamespace(myFunction, 4);
asyncNamespace({
    fn: myFunction,
    threads: 4
}); 
```

<a name="fn"></a>
## The `fn` callback function

The function you provide will be called with two arguments:

<a name="fn-arguments"></a>
### Arguments
Name | Type | Use
--- | --- | ---
runAsync | [Function](https://developer.mozilla.org/en-US/docs/Glossary/Function) | This function is used to run code in other threads.
threads | [Number](https://developer.mozilla.org/en-US/docs/Glossary/Number) | The amount of threads that are available.

<a name="fn-example"></a>
### Example

```javascript
asyncNamespace(function(runAsync,threads){
    console.log(`Using ${threads} threads.`);
    // runAsync can be used here,
    // see how to in the next point
});
```

<a name="runasync"></a>
## The `runAsync` function
---

In the namespace, you can use this function to execute code in other threads.

<a name="runasync-parameters"></a>
### Parameters
Name | Type | Optional | Default | Use
--- | --- | --- | --- | --- 
fn | [Function](https://developer.mozilla.org/en-US/docs/Glossary/Function) | No | *void* | This function will be executed in another thread.
parameters | [Array](https://developer.mozilla.org/en-US/docs/Glossary/Array) or a single value | Yes | [] | Used to import local variables into the thread. If you only provide one value and not an array, that will be used as argument. **Warning:** Only object which can be cloned using the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#Supported_types) can be send across threads. Trying to send invalid object will cause the promise to reject.
thread | [Number](https://developer.mozilla.org/en-US/docs/Glossary/Number) or *`false`* | Yes | *automatically computed* | Specifies a specific thread to use. It normally iterates over the available threads and chooses the one last used. 

If `thread` is set to *`false`*, a new thread only for `fn` will be created, the function will be eval'd and take no parameters.

<a name="runasync-return"></a>
### Return value

`runAsync` returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

Promise state | Value
--- | --- 
onresolve | The return value of `runAsync` or *`undefined`*.
onreject | An error object. This can have multiple reasons; all cloning errors and errors thrown while the function executes trigger `onreject`.

<a name="runasync-causes"></a>
### Causes for `onreject`

Here are the causes for a rejection of the promise. The error will be provided as argument. See below for examples.

Cause | Type | Message
--- | --- | --- 
Invalid value for `fn` | [TypeError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypeError) | ``asyncNamespace<fn>: the parameter `fn` is not a function``
Invalid thread number | [RangeError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RangeError) | ``asyncNamespace<fn>: there is no thread {thread}``
Failed to clone data | [DOMException\<DataCloneError>](https://developer.mozilla.org/en-US/docs/Web/API/DOMException#Error_names) | ``Failed to execute 'postMessage' on 'Worker': {Your value} could not be cloned.``
Error thrown in the thread | *Theoretically any* | *The error message*

<a name="examples"></a>
## Examples

```javascript
asyncNamespace((runAsync)=>{
    /*
    * Most simple method
    */
    runAsync(() => 1 + 1) 
        .then(result => console.log(`The result is ${result}`))
        .catch(err => console.log(`Oh no, a ${err.name} was received!`));
        // You of course dont need a catch clause
        // when working with simple values
    
    /*
     * Using parameters
     */
    let local = 5,
        local2 = -2;
    runAsync((a,b)=>a*b, [local])
        .then(result => result === -10);
        
    /*
     * A single parameter
     */
    runAsync(text => text + "World!", "Hello ")
        .then(result => console.log(result));
});
```

<a name="error-examples"></a>
## Error examples

```javascript
asyncNamespace(function(runAsync, threads){

    let testFunc = a => a + 1;
    
    /*
     * Using the parameters argument
     */
    runAsync(testFunc, [5] )
        .then(result => result === 6 ); // true
        
    runAsync(testFunc, [new XMLHttpRequest] ) // error example with invalid data
        .catch(err => console.log(err));
    
    /*
     * explicit thread
     */
    runAsync(testFunc, [-5], 0)
        .then(result => result === -4 );
        // Note that the threads index starts at 0,
        // which means if you have 1 thread available
        // using the value `1` will cause a RangeError
        
    /*
     * code that will throw a runtime error
     */
    runAsync(function(){
        return new notexistingobject;    
    })
        .then(result => console.log(`The result is ${result}`))
        .catch(err => console.log(err));
});
```