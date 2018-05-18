/*
 * AsyncNameSpace library
 * Made by Draphar
 * v1.0
 * https://github.com/Draphar/async-namespace
 */
function asyncNamespace(a,threads) {

	const buildWorker = code => new Worker(URL.createObjectURL(new Blob([code],{
		type: "application/javascript"
	})));

	let callback;
	if (typeof a === "function")
		callback = a;
	else
		callback = a.fn;

	if (typeof callback !== "function")
		throw new TypeError("asyncNamespace: `fn` is not a function");

	if (typeof threads === "undefined")
		threads = a.threads || navigator.hardwareConcurrency;
	else
		threads = threads || navigator.hardwareConcurrency;

	threads = parseInt(threads);
	if (isNaN(threads) || threads <= 0) {
		console.warn("asyncNamespace: no valid value for `threads` provided");
		threads = navigator.hardwareConcurrency;
	}

	let workers = [],
		availableThreads = threads - 1,
		current = 0,
		run = 0;
	for (let i = availableThreads; i >= 0; i -= 1) 
		workers[i] = buildWorker("onmessage=e=>{try{postMessage([e.data[0],new Function('params',`return (${e.data[1]}).apply(self,params);`)(e.data[2])]);}catch(err){postMessage([e.data[0],['Error',err.name,err.message]]);}}");

	let executor = function(fn,parameters,thread) {
		return new Promise((resolve,reject) => {

				if (typeof fn !== "function")
					reject(new TypeError("asyncNamespace<fn>: the parameter `fn` is not a function"));
				if (! parameters)
					parameters = [];
				if (! (parameters instanceof Array))
					parameters = [parameters];

				if (thread === false) {
					const worker = new Worker(URL.createObjectURL(new Blob(["onmessage=e=>{postMessage(eval('('+e.data+')();'));close();}"],{
						type: "application/javascript"
					})));
					worker.onmessage = e => resolve(e.data);
					worker.onerror = e => reject(e);
					worker.postMessage(fn.toString());
					return;
				} else if (! thread && thread !== 0) {
					thread = current;
					current = current + 1 > availableThreads ? 0 : current + 1;
				} else
					thread = parseInt(thread);

				const id = run,
					worker = workers[thread];
				run += 1;

				if (typeof worker === "undefined")
					reject(new RangeError(`asyncNamespace<fn>: there is no thread ${thread}`));

				worker.addEventListener("message",e => {
					if (e.data[0] === id) {
						const data = e.data[1];
						if (data instanceof Array && data[0] === "Error")
							reject(new window[data[1]](data[2]));
						else
							resolve(data);
						worker.removeEventListener("message",arguments.callee);
					}
				});

				try {
					worker.postMessage([id,fn.toString(),parameters]);
				} catch (e) {
					reject(e);
				}

			}
		);
	}

	callback.call(executor,executor,threads);

}