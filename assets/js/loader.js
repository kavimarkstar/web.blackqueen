document.addEventListener("DOMContentLoaded", () => {
    // Component එකක් fetch කරලා අදාළ Div එකට දාන පොදු function එක
    const loadComponent = (elementId, filePath) => {
        const element = document.getElementById(elementId);
        if (element) {
            fetch(filePath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load ${filePath}: ${response.statusText}`);
                    }
                    return response.text();
                })
                .then(data => {
                    element.innerHTML = data;
                    // හෙඩර්/ෆුටර් එක ඇතුලේ Lucide Icons තිබ්බොත් ඒවා ආයෙත් active කරනවා
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                })
                .catch(error => console.error("Error loading component:", error));
        }
    };

    // Header සහ Footer Load කිරීම
    loadComponent('header-placeholder', 'components/header.html');
    loadComponent('footer-placeholder', 'components/footer.html');
});