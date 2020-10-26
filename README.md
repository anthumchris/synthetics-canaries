# synthetics-canaries
Examples for using [AWS CloudWatch Synthetics Canaries](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Canaries.html) with canaries that also run locally.

## Installation

```js
$ npm install
```

### Local Requirements
1. [**NodeJS**](https://nodejs.org/) - For best compatibility, use versions specified in [Canary runtime versions](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Canaries_Library.html).
1. **Zip** - Command line utility for creating zip files.

# Examples

`$ npm run canaries-run`

Runs specified list of canaries locally.

`$ npm run canaries-package`

Creates a zip file of canaries in the required structure for uploading to AWS S3 and importing into CloudWatch Synthetics.
