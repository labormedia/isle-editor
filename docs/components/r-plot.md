# R Plot

Component for rendering an R plot inside an ISLE lesson.

#### Example:

``` js
<RPlot code="hist( c(20,50,40,70,40,30) )" />
```

#### Options:

* __code__: R code used to create the plot. Default: `''`.
* __width__: `number` giving the width of the created plot (in px). Default: `600`.
* __height__: `number` giving the height of the created plot (in px). Default: `400`.
* __libraries__: `Array` of R libraries that should be loaded automatically when the input `code` is executed. Default: `[]`.
* __prependCode__: `string` or an `Array` of R code to be prepended to the code stored in `code` when evaluating. Default: `''`.
