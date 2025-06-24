# The JS Node API

Nodes can do anything--anything in JS. They are constrained in how they do this though.

A node is like a function. It needs to know it's input spec, output spec, and how to get from the inputs to the outputs. Along the way, it may want to import more functionality from somewhere else (i.e. the internet, an API, or a package that allows us to do client side computation). So here's how that works:

```
node (inputs, outputs, utils, console, importNode) {
    ... logic here
    inputs.x // get the value of x
    utils.Jimp.read(imageFileContent) // use the Jimp library
    const someData = await fetch('https://anexternaldatasource.net/data.json') // get data from external sources
    greyscale = importNode({nid: 'greyscale_jimp_image'}) // import another nodes function (note this is a madeup example node)
    outputs.set('y', 2*inputs.x) // set the value of y. only set value that were defined on the spec, or you will get an error unless the spec is not strict
    console.warn(...); // log warnings, etc.
    // throw new Error('example error'); // this would display an error on the node and halt flow execution
}
```


