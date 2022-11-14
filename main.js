const Apify = require("apify");
const { tools } = require("@apify/scraper-tools");
const _ = require("underscore");
const { Capabilities, Builder, By, Key, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const proxy = require("selenium-webdriver/proxy");
const { anonymizeProxy } = require("proxy-chain");

const launchFirefoxWebdriver = async (proxyUrl) => {
    // logging.installConsoleHandler();
    // logging.getLogger('webdriver.http').setLevel(logging.Level.ALL);

    // See https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities for reference.
    const capabilities = new Capabilities();
    capabilities.set("browserName", "firefox");

    const builder = new Builder();

    const firefoxOptions = new firefox.Options();

    let firefoxPath;
    if (process.env.APIFY_XVFB === "1") {
        // Running on server
        firefoxPath = "/firefox/firefox-bin";
    } else {
        // Running locally
        firefoxPath = "/usr/bin/firefox";
    }

    console.log(`Using Firefox executable: ${firefoxPath}`);
    firefoxOptions.setBinary(firefoxPath);

    const setup = builder
        .setFirefoxOptions(firefoxOptions)
        .withCapabilities(capabilities);

    if (proxyUrl) {
        console.log("Using provided proxyUrl");
        const anonProxyUrl = await anonymizeProxy(proxyUrl);
        const parsed = new URL(anonProxyUrl);
        setup.setProxy(
            proxy.manual({
                http: parsed.host,
                https: parsed.host,
                ftp: parsed.host,
            })
        );
    }

    const webDriver = setup.build();
    return webDriver;
};

Apify.main(async () => {
    const input = await Apify.getInput();
    const startURLs = input.startUrls;

    // Dataset
    let dataset = await Apify.openDataset(input.datasetName);
    const { itemsCount } = await dataset.getInfo();
    let = itemsCount || 0;

    // KeyValueStore
    keyValueStore = await Apify.openKeyValueStore(input.keyValueStoreName);

    evaledPageFunction = tools.evalFunctionOrThrow(input.pageFunction);

    for (i = 0; i < startURLs.length; i++) {
        const requestURL = startURLs[i].url;
        const userData = startURLs[i].userData;

        const webDriver = await launchFirefoxWebdriver(input.proxyUrl);

        console.log(`Opening URL: ${requestURL}`);
        const xxx = await webDriver.get(requestURL);

        const context = {
            requestURL,
            userData,
            driver: webDriver,
            By,
            Key,
            until,
        };

        const pageFunctionResult = await evaledPageFunction(context);

        const payload = tools.createDatasetPayload(
            {},
            {},
            pageFunctionResult,
            false
        );

        await dataset.pushData(payload);

        await webDriver.quit();
    }

    console.log("Done.");
});
