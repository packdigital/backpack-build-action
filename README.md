<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>

# Backpackjs Build Action

## Inputs

### `branch`
  
Branch name

### `netlify_site_id`
  
**Required** `NETLIFY_SITE_ID` env variable

### `netlify_auth_token`

**Required** `NETLIFY_AUTH_TOKEN` env variable

### `npm_auth_token`
  
**Required** `NPM_AUTH_TOKEN` env variable

### `backpack_api_secret_token`
  
**Required** `BACKPACK_API_SECRET_TOKEN` env variable

### `backpack_site_id`
  
**Required** `BACKPACK_SITE_ID` env variable

### `cms_content_token`
  
**Required** `CMS_CONTENT_TOKEN` env variable

### `cms_management_token`
  
**Required** `CMS_MANAGEMENT_TOKEN` env variable

### `shopify_domain`
  
**Required** `SHOPIFY_DOMAIN` env variable

### `shopify_admin_api_token`
  
**Required** `SHOPIFY_ADMIN_API_TOKEN` env variable

### `shopify_storefront_api_token`
  
**Required** `SHOPIFY_STOREFRONT_API_TOKEN` env variable

### `site_url`
  
**Required** `SITE_URL` env variable

### `pack_api_url`
  
Direct staging deploys to call staging

### `auto_deploy_netlify_disabled`
  
Deploy production locked

## Outputs

## Example usage

```yaml
uses: packdigital/backpack-build-action@main
with:
  who-to-greet: 'Mona the Octocat'
```

Install the dependencies  
```bash
$ npm install
```

Build the typescript and package it for distribution
```bash
$ npm run build && npm run package
```

Run the tests :heavy_check_mark:  
```bash
$ npm test

 PASS  ./index.test.js
  ✓ throws invalid number (3ms)
  ✓ wait 500 ms (504ms)
  ✓ test runs (95ms)

...
```

See the [toolkit documentation](https://github.com/actions/toolkit/blob/master/README.md#packages) for the various packages.

## Validate

You can now validate the action by referencing `./` in a workflow in your repo (see [test.yml](.github/workflows/test.yml))

```yaml
uses: ./
with:
  milliseconds: 1000
```

See the [actions tab](https://github.com/actions/typescript-action/actions) for runs of this action! :rocket:
