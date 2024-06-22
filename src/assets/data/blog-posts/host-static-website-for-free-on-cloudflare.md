#

## Deploying a static website for free

When you create a webpage such as a blog or a portfolio, the chances are high that the content is static. This means that the content does not change frequently and can be served as is to the user. Since those kinds of projects are often on a small scale, there is no need to pay for a server to host them. You can rather use services like GitHub Pages, Netlify or Cloudflare Pages to host your static website for free.

I use Cloudflare Pages to host my blog. The reason for this setup is that I use Cloudflare as my DNS provider and I like the idea of having everything in one place. In this article, I will show you how to host a static website on Cloudflare Pages, deploy it with GitHub Actions and set up a custom domain.

## Prerequisites

Before we start, you need to have the following:

- A GitHub account
- A Cloudflare account
- A domain name (optional)

## Setting up the necessary projects

First, create a new repository on GitHub. You can name it whatever you want. I will name mine `starsbit.space`. I assume you know how to create a new repository on GitHub. If not, you can follow the [official guide](https://docs.github.com/en/github/getting-started-with-github/create-a-repo). Afterward, clone the repository to your local machine and publish your static website in the repository.

Next, go to the [Cloudflare Pages dashboard](https://dash.cloudflare.com/) and click on the `Workers & Pages` tab and then on the `Overview` sub-tab. Then press the `Create` button. Here you will be met a selection.

![Create an application page selection](assets/images/blog/host-static-website-for-free-on-cloudflare/CreateAnApplication.png)

Click on the `Pages` menu item. So you will be met with the following screen:

![Create an application page, Pages screen](assets/images/blog/host-static-website-for-free-on-cloudflare/CreateAnApplicationPages.png)

Click here on the `Connect to Git` button. You will be met with a selection of your GitHub or GitLab repositories. Select the repository you created earlier and click `Begin setup`.

Now select your production branch which is usually `main` or `master`. If you use a framework like Angular or library like React, you can use the `Framework preset`. If you need something more specialized you can use the `Manual` preset. I will use the `Framework preset` for Angular for this article. If needed the root directory can be changed and environment variables can be set. Afterward, click on the `Save and Deploy` button.

After the setup on cloudflares page is done, you should be able to see your website on the domain `your-repository-name.pages.dev`. This may take a few minutes to be active after the initial setup, so dont worry. You should also be able to see this page too:

![Create an application page, Pages screen](assets/images/blog/host-static-website-for-free-on-cloudflare/WorkerAndPagesPage.png)

## Setting up deployments from command line

If you want to deploy your website from the command line, you can use the `wrangler` CLI tool. You can install it with the following command:

```bash
npm install --save-dev wrangler
```

In this guide I use `"wrangler": "^3.61.0"` as the version. You can check the latest version on the [npm page](https://www.npmjs.com/package/wrangler).

Now run in the bash this command:

```bash
npx wrangler pages project create
```

Enter the correct project name now and press enter. In my case this would be `starsbit.space`.

Now you should be able to upload your build files to Cloudflare Pages with the following command:

```bash
npx wrangler pages deploy ./dist/name-of-your-project
```

### Special steps for Angular SSR projects

If you run into problems with typescript errors in any of the following steps, install those dependencies:

```bash
npm install --save-dev @cloudflare/workers-types @miniflare/tre
```

If you use Angulars SSR feature, you need to add a few more steps to make it work. First create the following files in the root of your project:

`tools/alter-polyfills.mjs`:

```javascript
import fs from "node:fs";
import { EOL } from "node:os";
import { join } from "node:path";
import { worker } from "./paths.mjs";

/**
 * Split by lines and comment the banner
 * ```
 * import { createRequire } from 'node:module';
 * globalThis['require'] ??= createRequire(import.meta.url);
 * ```
 */
const serverPolyfillsFile = join(worker, "polyfills.server.mjs");
const serverPolyfillsData = fs
 .readFileSync(serverPolyfillsFile, "utf8")
 .split(/\r?\n/);

for (let index = 0; index < 2; index++) {
 if (serverPolyfillsData[index].includes("createRequire")) {
  serverPolyfillsData[index] = "// " + serverPolyfillsData[index];
 }
}

// Add needed polyfills
serverPolyfillsData.unshift(`globalThis['process'] = {};`);

fs.writeFileSync(serverPolyfillsFile, serverPolyfillsData.join(EOL));
```

`tools/copy-files.mjs`:

```javascript
// Copy the files over so that they can be uploaded by the pages publish command.
import fs from "node:fs";
import { join } from "node:path";
import { client, cloudflare, ssr, worker } from "./paths.mjs";

fs.cpSync(client, cloudflare, { recursive: true });
fs.cpSync(ssr, worker, { recursive: true });

fs.renameSync(join(worker, "server.mjs"), join(worker, "index.js"));
```

`tools/paths.mjs`:

```javascript
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(dirname, "..");
export const client = path.resolve(root, "dist/browser");
export const ssr = path.resolve(root, "dist/server");
export const cloudflare = path.resolve(root, "dist/cloudflare");
export const worker = path.resolve(cloudflare, "_worker.js");
```

Then make sure to edit `server.ts` file in the root of your project:

```typescript
import { renderApplication } from "@angular/platform-server";
import bootstrap from "./src/main.server";

interface Env {
 ASSETS: { fetch: typeof fetch };
}

// We attach the Cloudflare `fetch()` handler to the global scope
// so that we can export it when we process the Angular output.
// See tools/bundle.mjs
async function workerFetchHandler(request: Request, env: Env) {
 const url = new URL(request.url);
 console.log("render SSR", url.href);

 // Get the root `index.html` content.
 const indexUrl = new URL("/", url);
 const indexResponse = await env.ASSETS.fetch(new Request(indexUrl));
 const document = await indexResponse.text();

 const content = await renderApplication(bootstrap, {
  document,
  url: url.pathname,
 });

 // console.log("rendered SSR", content);
 return new Response(content, indexResponse);
}

export default {
 fetch: (request: Request, env: Env) =>
  (globalThis as any)["__zone_symbol__Promise"].resolve(
   workerFetchHandler(request, env)
  ),
};
```

Now finally you can do some minor changes to your `package.json` file:

```json
"scripts": {
    "build": "ng build && npm run process",
    "serve:ssr:starsbit": "node dist/starsbit/server/server.mjs",
    "process": "node ./tools/copy-files.mjs && node ./tools/alter-polyfills.mjs",
    "deploy": "npm run build --omit=dev && wrangler pages deploy dist/cloudflare"
},
```

Now running `npm run deploy` should deploy your Angular SSR project to Cloudflare Pages.

## Setting up GitHub Actions

To automate the deployment process, you can use GitHub Actions. Create a new file in the `.github/workflows` directory in your repository. You can name it whatever you want. I will name mine `deploy.yml`. Add the following content to the file:

```yaml
name: Deploy

# This workflow is triggered on push events to the master branch
on:
  push:
    branches:
      - master

jobs:
  deploy:
    runs-on: ubuntu-latest
    # This is the secret you need to set in the GitHub repository settings
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

    # Checkout the code
    steps:
    - name: Checkout code
      uses: actions/checkout@v2

    # Set up Node.js environment. You can change the version to whatever you need
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'

    # Install dependencies
    - name: Install dependencies
      run: npm install

    # Run the deploy script of your package.json or `npx wrangler pages deploy ./dist/name-of-your-project`
    - name: Deploy
      run: npm run deploy
```

This workflow wont work on its own sadly. You need to setup the `CLOUDFLARE_API_TOKEN` secret in the GitHub repository settings. First create an API token. Go to the [Cloudflare profile](https://dash.cloudflare.com/profile/api-tokens) page and click on the `API Tokens` tab. Then click on the `Create Token` button. Select the `Edit Cloudflare Workers` template and give the token a name. Then click on the `Create Token` button. Copy the token and save it somewhere safe.

Now you need to upload the token to your GitHub repository. You can do this by going to the repository settings, then to the `Secrets and variables` tab and then pressing the `New repository secret` button. Name the secret `CLOUDFLARE_API_TOKEN` and paste your Cloudflare API token as the value. It should look like this:

![Upload your Cloudflare API token](assets/images/blog/host-static-website-for-free-on-cloudflare/GitHubSecrets.png)

Now every time you push to the `master` branch, the GitHub Actions workflow will run and deploy your website to Cloudflare Pages.

## Setting up a custom domain

This step is optional and requires you to have a domain name that you own.

If you want to use a custom domain for your website, you can do so by going to the `Custom domains` tab in the Cloudflare Pages dashboard.

![Custom domains page](assets/images/blog/host-static-website-for-free-on-cloudflare/CustomDomains.png)

Click the `Setup custom domain` button and enter your domain name. Then wait for the domain to become active. You will need to add a `CNAME` record to your DNS provider. The `CNAME` record should point to `your-repository-name.pages.dev`.

With this setup, you can now view your page on your custom domain.

If you want to setup a redirect for the `www` subdomain, you can do so by adding a `A` record for this. The name should be `www`. The content for it should be `192.0.2.1` and the proxy status should be `Proxied`.

Now finally you can add a page rule to redirect the `www.your-domain-name/*` URL. IT should be set to `Forwarding URL` and the destination URL should be `https://your-domain-name/$1`. The status code should be `301 - Permanent Redirect`.

Here is how the page rule should look like:

![Page rules](assets/images/blog/host-static-website-for-free-on-cloudflare/PageRules.png)

Now even if someone enters `www.your-domain-name` they will be redirected to `your-domain-name`.

## Conclusion

In this article, I showed you how to host a static website for free on Cloudflare Pages. I showed you how to set up the necessary projects, how to deploy from the command line, how to set up GitHub Actions and how to set up a custom domain. I hope this article was helpful to you. If you have any feedback, feel free to reach out to me.
