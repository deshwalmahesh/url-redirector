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

    // To prevent errors with existing IDs, remove all current rules and add the new set.
    // This synchronizes the ruleset with the current state from storage.
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds,
        addRules: newRules
    });
};

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.redirectRules) {
        updateRules();
    }
});

updateRules();