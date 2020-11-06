# Building plan viewer

> This project has been initiated for a lecture at the munich university of applied sciences and supports
> the NuData Campus project.

## Inline the HTML in a single file

We can use the npm package `inliner`:

```
inliner http://localhost > index.html
```

Unfortunately a server is needed to host the page.
Additionally we need to still include the DXF file in a variable and set a flag that the application should read from that global variable containing the DXF file string.
