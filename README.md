[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# caniemail

Check HTML and CSS Feature Support for Email Clients from [caniemail.com](https://caniemail.com)

## Requirements

The packages requires an [LTS](https://github.com/nodejs/Release) Node version (v20.19.0+)

## Installation

Install the package from npm using your favourite package manager:

```shell
pnpm add caniemail
# bun add caniemail
# yarn add caniemail
# npm add caniemail
```

## Exports

### caniemail(options)

Returns:

```typescript
interface CanIEmailResult {
  issues: FeatureIssues;
  success: boolean;
}
```

#### `options`

Type: `CanIEmailOptions`

```typescript
interface CanIEmailOptions {
  /**
    An array of client names or globs to match email clients.
    Example: ['gmail.android', 'outlook.*', '*.ios']
  */
  clients: EmailClientGlobs[];
  css?: string;
  html?: string;
}
```

##### `clients`

Type: `EmailClientGlobs[]`<br>
Required: `true`

An array of globs for matching email clients to be checked against CanIEmail data. For more information about the glob syntax that is used, refer to the [micromatch](https://www.npmjs.com/package/micromatch) documentation.

To match all clients, pass `['*']`.

Possible email clients:

```javascript
[
  'aol.android',
  'aol.desktop-webmail',
  'aol.ios',
  'apple-mail.ios',
  'apple-mail.macos',
  'fastmail.desktop-webmail',
  'free-fr.desktop-webmail',
  'gmail.android',
  'gmail.desktop-webmail',
  'gmail.ios',
  'gmail.mobile-webmail',
  'gmx.android',
  'gmx.desktop-webmail',
  'gmx.ios',
  'hey.desktop-webmail',
  'ionos-1and1.android',
  'ionos-1and1.desktop-webmail',
  'laposte.android',
  'laposte.desktop-webmail',
  'laposte.ios',
  'mail-ru.desktop-webmail',
  'orange.android',
  'orange.desktop-webmail',
  'orange.ios',
  'outlook.android',
  'outlook.ios',
  'outlook.macos',
  'outlook.outlook-com',
  'outlook.windows',
  'outlook.windows-mail',
  'protonmail.android',
  'protonmail.desktop-webmail',
  'protonmail.ios',
  'rainloop.desktop-webmail',
  'samsung-email.android',
  'sfr.android',
  'sfr.desktop-webmail',
  'sfr.ios',
  't-online-de.desktop-webmail',
  'thunderbird.macos',
  'thunderbird.windows',
  'web-de.android',
  'web-de.desktop-webmail',
  'web-de.ios',
  'wp-pl.desktop-webmail',
  'yahoo.android',
  'yahoo.desktop-webmail',
  'yahoo.ios'
];
```

Example: `["gmail.*", "*.desktop-webmail"]`

##### `css`

Type: `string`<br>
Required: `false`

CSS string to analyze for email client compatibility.

##### `html`

Type: `string`<br>
Required: `false`

HTML string to analyze for email client compatibility.

> [!NOTE]  
> At least one of `css` or `html` must be provided.

### `formatIssue(options)`

Returns:

```typescript
{
  message: string;
  notes: string[];
}
```

#### `options`

Type:

```typescript
interface FormatIssueOptions {
  client: EmailClient;
  issue: FeatureIssue;
  issueType: 'error' | 'warning';
}
```

##### `client`

Type: `EmailClient`<br>
Required: `true`

The email client to format the issue for.

##### `issue`

Type: `FeatureIssue`<br>
Required: `true`

The feature issue to format.

##### `issueType`

Type: `'error' | 'warning'`<br>
Required: `true`

The type of issue being formatted. Determines the formatting of the message.

## Contributing, Working With This Repo

We 💛 contributions! After all, this is a community-driven project. We have no corporate sponsorship or backing. The maintainers and users keep this project going!

Please check out our [Contribution Guide](./CONTRIBUTING.md).

## License

[MIT License](./LICENSE.md)
