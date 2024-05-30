#

## Why do you need to set up mathematical and code expressions?

When you write a blog post, you may need to include mathematical and code expressions. For example, you may want to include a mathematical expression like this: $x^2 + y^2 = z^2$. Or you may want to include a code expression like this:

```python
def hello_world():
    print("Hello, World!")
```

In my blog posts, I often include mathematical and code expressions. So there was demand for me to set up mathematical and code expressions in my blog posts.

## What is ngx-markdown?

[ngx-markdown](https://www.npmjs.com/package/ngx-markdown) is a powerful Angular library that allows developers to seamlessly integrate Markdown parsing and rendering capabilities into their Angular applications. This library provides various tools to handle static, dynamic, or remote Markdown content and convert it into HTML with added support for syntax highlighting.

In this blog this library is used to render all blog posts. This way I can easily write a blog post in Markdown and ngx-markdown will take care of rendering it. So I only need to maintain one component to render all blog posts. This makes it easy to maintain and update the blog.

## How to set up and style code expressions in ngx-markdown

To set up code expressions in ngx-markdown, you need to install the [ngx-markdown](https://www.npmjs.com/package/ngx-markdown) and [prismjs](https://prismjs.com/) libraries. You can install it using the following command:

```bash
npm install ngx-markdown marked@^12.0.0 --save # The Markdown parser
npm install prismjs@^1.28.0 --save # The syntax highlighter
```

After installing the library, you need to edit your `angular.json` file to include the PrismJS CSS file. You can do this by adding the following code to your `angular.json` file:

```json
"styles": [
  "src/styles.scss",
  "src/styles/_code-theme.scss" // used for the custom code theme
],
"scripts": [
  "node_modules/prismjs/prism.js",
  "node_modules/prismjs/components/prism-typescript.min.js", // typescript syntax highlighting
  "node_modules/prismjs/components/prism-scss.min.js", // scss syntax highlighting
  "node_modules/prismjs/components/prism-python.min.js", // python syntax highlighting
  "node_modules/prismjs/components/prism-bash.min.js", // bash syntax highlighting
  "node_modules/prismjs/components/prism-json.min.js" // json syntax highlighting
]
```

With this in place, you can now use the `ngx-markdown` library to render code expressions in your Angular application. An example of how to use the `ngx-markdown` library to render code expressions is shown below:

```markdown
    ```python
    def hello_world():
        print("Hello, World!")
    ```
```

This will render the following code expression:

```python
def hello_world():
    print("Hello, World!")
```

### How to style code expressions

To style code expressions, you need to setup a `scss` file that styles the content. Many examples can be found in this [repository](https://github.com/PrismJS/prism-themes). You dont need to install all the themes. I would suggest to only use the theme you like and include it on your own.

Create a file `_code-theme.scss` in your `src/styles` folder and add the following code (this is an example of the [`prism-vsc-dark-plus` theme](https://github.com/PrismJS/prism-themes/blob/master/themes/prism-vsc-dark-plus.css) theme):

```scss
pre[class*="language-"],
code[class*="language-"] {
  color: #d4d4d4;
  text-shadow: none;
  font-family: Menlo, Monaco, Consolas, "Andale Mono", "Ubuntu Mono",
    "Courier New", monospace;
  direction: ltr;
  text-align: left;
  white-space: pre;
  word-spacing: normal;
  word-break: normal;
  line-height: 1.5;
  -moz-tab-size: 4;
  -o-tab-size: 4;
  tab-size: 4;
  -webkit-hyphens: none;
  -moz-hyphens: none;
  -ms-hyphens: none;
  hyphens: none;
}

pre[class*="language-"]::selection,
code[class*="language-"]::selection,
pre[class*="language-"] *::selection,
code[class*="language-"] *::selection {
  text-shadow: none;
  background: #264f78;
}

@media print {
  pre[class*="language-"],
  code[class*="language-"] {
    text-shadow: none;
  }
}

pre[class*="language-"] {
  padding: 1em;
  margin: 0.5em 0;
  overflow: auto;
  background: #1e1e1e;
}

:not(pre) > code[class*="language-"] {
  padding: 0.1em 0.3em;
  border-radius: 0.3em;
  color: #db4c69;
  background: #1e1e1e;
}

...
```

I modified theme to fit my blog style. I removed the font-size and modified line-height so that it fits the other blog elements better. With this setup, you now have a custom code theme that you can use to style code expressions in your Angular application.

## How to set up mathematical expressions in ngx-markdown

To set up mathematical expressions in ngx-markdown, you need to install the [ngx-markdown](https://www.npmjs.com/package/ngx-markdown) and [$\KaTeX$](https://katex.org/) libraries. You can install it using the following command:

```bash
npm install ngx-markdown marked@^12.0.0 --save # The Markdown parser
npm install katex@^0.16.0 --save # The mathematical expression renderer
```

Edit your `angular.json` file to include the $\KaTeX$ CSS file. You can do this by adding the following code to your `angular.json` file:

```json
"styles": [
  "styles.css",
  "node_modules/katex/dist/katex.min.css" // The KaTeX CSS file
],
"scripts": [
  "node_modules/katex/dist/katex.min.js", // The KaTeX JS file
  "node_modules/katex/dist/contrib/auto-render.min.js", // The KaTeX auto-render JS file
]
```

Then you need to declare the usage of $\KaTeX$ in your `ngx-markdown` declaration:

```html
<markdown
    [src]="postData.file"
    katex
></markdown>
```

With this in place, you can now use the `ngx-markdown` library to render mathematical expressions in your Angular application. An example of how to use the `ngx-markdown` library to render mathematical expressions is shown below:

```markdown
$x^2 + y^2 = z^2$
```

This will render the following mathematical expression:

$x^2 + y^2 = z^2$

With $\KaTeX$ you can render complex mathematical expressions in your Angular application. This makes it easy to include mathematical expressions in your blog posts. A bigger example to demonstrate the power of $\KaTeX$ is shown below:

```markdown
Example for theorems:

Let $\mathcal{F} = (P_1,\dots,P_n)\in (2^{AP})^n$ be fairness constraints. Trace $A_0, A_1,\dots$ is $\mathcal{F}$-fair, if:

$\forall I= 1,\dots,n: \exists^\infty j: P_i \cap A_j \neq \emptyset$

Example for a mathematical expression:

$f(\relax{x}) = \int_{-\infty}^\infty \hat f(\xi)\,e^{2 \pi i \xi x}\,d\xi$
```

This will render the following mathematical expression:

Example for theorems:

Let $\mathcal{F} = (P_1,\dots,P_n)\in (2^{AP})^n$ be fairness constraints. Trace $A_0, A_1,\dots$ is $\mathcal{F}$-fair, if:

$\forall I= 1,\dots,n: \exists^\infty j: P_i \cap A_j \neq \emptyset$

Example for a mathematical expression:

$f(\relax{x}) = \int_{-\infty}^\infty \hat f(\xi)\,e^{2 \pi i \xi x}\,d\xi$

## Conclusion

In this blog post, I showed you how to set up mathematical and code expressions in your Angular application using the `ngx-markdown` library. I also showed you how to style code expressions using the PrismJS library. With this setup, you can easily include mathematical and code expressions in your blog posts when using a similar setup to mine. This makes it easy to write technical blog posts that include mathematical and code expressions. If you have any questions or concerns feel free to reach out to me on any of my social media platforms.
