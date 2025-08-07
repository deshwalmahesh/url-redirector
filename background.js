// Default redirection rules
const defaultRules = [
    { id: 1, source: 'https://www.instagram.com/(.*)', destination: 'https://www.alphaxiv.org/', enabled: true },
    { id: 2, source: 'https://www.facebook.com/(.*)', destination: 'https://colab.research.google.com/', enabled: true },
    { id: 3, source: 'https://twitter.com/(.*)', destination: 'https://github.com/', enabled: true },
    { id: 4, source: 'https://x.com/(.*)', destination: 'https://kaggle.com/', enabled: true },
    { id: 5, source: 'https://arxiv.org/(.*)', destination: 'https://www.alphaxiv.org/$1', enabled: true },
    { id: 6, source: 'https://www.amazon.in/(.*)', destination: 'https://www.uusc.org/extreme-poverty-is-on-the-rise-we-must-not-let-this-trend-continue%EF%BF%BC/', enabled: true },
    { id: 7, source: 'https://www.myntra.com/(.*)', destination: 'https://www.uusc.org/extreme-poverty-is-on-the-rise-we-must-not-let-this-trend-continue%EF%BF%BC/', enabled: true },
    { id: 8, source: 'https://www.ajio.com/(.*)', destination: 'https://www.globalcitizen.org/en/content/extreme-poverty-definition-statistics-rate/', enabled: true },
    { id: 9, source: 'https://www.flipkart.com/(.*)', destination: 'https://www.uusc.org/extreme-poverty-is-on-the-rise-we-must-not-let-this-trend-continue%EF%BF%BC/', enabled: true },
    { id: 10, source: 'https://www.netflix.com/(.*)', destination: 'https://www.deeplearning.ai/courses/?courses_date_desc%5BrefinementList%5D%5Bskill_level%5D%5B0%5D=Intermediate', enabled: true },
    { id: 11, source: 'https://www.hotstar.com/(.*)', destination: 'https://www.youtube.com/results?search_query=cuda+programming', enabled: true },
];

// Function to update storage with new rules
const updateStorageWithNewRules = () => {
    chrome.storage.local.set({ redirectRules: defaultRules }, () => {
        console.log('Default rules have been stored.');
    });
};

// Update rules in declarativeNetRequest
const updateRules = async () => {
    const { redirectRules: rules } = await chrome.storage.local.get('redirectRules');
    if (!rules) {
        return;
    }

    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map(rule => rule.id);

    const newRules = rules
        .filter(rule => rule.enabled)
        .map(rule => ({
            id: rule.id,
            priority: 1,
            action: {
                type: 'redirect',
                redirect: {
                    regexSubstitution: rule.destination.replace(/\$(\d)/g, '\\$1')
                }
            },
            condition: {
                regexFilter: rule.source,
                resourceTypes: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'object', 'xmlhttprequest', 'other']
            }
        }));

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds,
        addRules: newRules
    });
};

// Listener for extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install' || details.reason === 'update') {
        updateStorageWithNewRules();
    }
});

// Listener for changes in storage
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.redirectRules) {
        updateRules();
    }
});

// Initial update of rules
updateRules();