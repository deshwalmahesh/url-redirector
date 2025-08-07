document.addEventListener('DOMContentLoaded', () => {
    const ruleForm = document.getElementById('rule-form');
    const rulesTableBody = document.querySelector('#rules-table tbody');
    const ruleIdInput = document.getElementById('rule-id');
    const sourceRegexInput = document.getElementById('source-regex');
    const destinationUrlInput = document.getElementById('destination-url');

    let rules = [];

    const saveRules = () => {
        if (chrome && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ redirectRules: rules }, () => {
                console.log('Rules saved to chrome.storage:', rules);
            });
        } else {
            localStorage.setItem('redirectRules', JSON.stringify(rules));
            console.log('Rules saved to localStorage:', rules);
        }
    };

    const renderRules = () => {
        rulesTableBody.innerHTML = '';
        rules.forEach(rule => {
            const row = document.createElement('tr');
            row.dataset.id = rule.id;
            row.innerHTML = `
                <td>
                    <label class="switch">
                        <input type="checkbox" class="enabled-checkbox" data-id="${rule.id}" ${rule.enabled ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </td>
                <td><input type="text" class="rule-input source-input" value="${rule.source}"></td>
                <td><input type="text" class="rule-input destination-input" value="${rule.destination}"></td>
                <td class="actions-cell">
                    <button class="delete-btn" data-id="${rule.id}">X</button>
                </td>
            `;
            rulesTableBody.appendChild(row);
        });
    };

    ruleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const source = sourceRegexInput.value.trim();
        const destination = destinationUrlInput.value.trim();
        const id = ruleIdInput.value;

        if (source && destination) {
            if (id) {
                // Update existing rule
                const ruleToUpdate = rules.find(rule => rule.id == id);
                if (ruleToUpdate) {
                    ruleToUpdate.source = source;
                    ruleToUpdate.destination = destination;
                }
            } else {
                // Add new rule with a unique ID
                const newId = rules.length > 0 ? Math.max(...rules.map(r => r.id)) + 1 : 1;
                rules.push({ id: newId, source, destination, enabled: true });
            }
            saveRules();
            renderRules();
            ruleForm.reset();
            ruleIdInput.value = '';
        }
    });

    rulesTableBody.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        const rule = rules.find(rule => rule.id == id);
        if (!rule) return;

        if (e.target.classList.contains('delete-btn')) {
            rules = rules.filter(rule => rule.id != id);
            saveRules();
            renderRules();
        } else if (e.target.classList.contains('enabled-checkbox')) {
            rule.enabled = e.target.checked;
            // No save here, will be saved with "Update All"
        }
    });

    document.getElementById('update-all-btn').addEventListener('click', () => {
        const rows = rulesTableBody.querySelectorAll('tr');
        const updatedRules = [];
        rows.forEach(row => {
            const id = row.dataset.id;
            const rule = rules.find(r => r.id == id);
            if (rule) {
                const source = row.querySelector('.source-input').value;
                const destination = row.querySelector('.destination-input').value;
                const enabled = row.querySelector('.enabled-checkbox').checked;
                updatedRules.push({ ...rule, source, destination, enabled });
            }
        });
        rules = updatedRules;
        saveRules();
        alert('All rules have been updated!');
    });

    const loadRules = (callback) => {
        if (chrome && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get('redirectRules', (data) => {
                callback(data.redirectRules || []);
            });
        } else {
            const storedRules = localStorage.getItem('redirectRules');
            callback(storedRules ? JSON.parse(storedRules) : []);
        }
    };

    loadRules((loadedRules) => {
        if (loadedRules.length > 0) {
            const fixedRules = [];
            const seenIds = new Set();
            let maxId = 0;

            // Repair loaded rules to ensure IDs are unique positive integers
            for (const rule of loadedRules) {
                let currentId = rule.id;
                if (typeof currentId !== 'number' || currentId <= 0 || seenIds.has(currentId)) {
                    currentId = maxId + 1;
                }
                seenIds.add(currentId);
                if (currentId > maxId) {
                    maxId = currentId;
                }
                fixedRules.push({ ...rule, id: currentId });
            }
            rules = fixedRules;
        } else {
            // Add default rules if none exist
            rules = [
                { id: 1, source: 'https://www.instagram.com/(.*)', destination: 'https://www.alphaxiv.org/', enabled: true },
                { id: 2, source: 'https://www.facebook.com/(.*)', destination: 'https://colab.research.google.com/', enabled: true },
                { id: 3, source: 'https://twitter.com/(.*)', destination: 'https://github.com/', enabled: true },
                { id: 4, source: 'https://x.com/(.*)', destination: 'https://leetcode.com/', enabled: true },
                { id: 5, source: 'https://arxiv.org/(.*)', destination: 'https://www.alphaxiv.org/$1', enabled: true },
                { id: 6, source: 'https://www.amazon.in/(.*)', destination: 'https://www.globalcitizen.org/en/content/extreme-poverty-definition-statistics-rate/', enabled: true },
                { id: 7, source: 'https://www.myntra.com/(.*)', destination: 'https://www.globalcitizen.org/en/content/extreme-poverty-definition-statistics-rate/', enabled: true },
                { id: 8, source: 'https://www.flipkart.com/(.*)', destination: 'https://www.globalcitizen.org/en/content/extreme-poverty-definition-statistics-rate/', enabled: true },
            ];
        }
        
        saveRules();
        renderRules();
    });
});