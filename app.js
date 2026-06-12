document.addEventListener('DOMContentLoaded', () => {
    const actionBtn = document.getElementById('action-btn');
    const diagnosticsPanel = document.getElementById('diagnostics-panel');
    const logItems = document.querySelectorAll('.log-list li');

    if (actionBtn && diagnosticsPanel) {
        actionBtn.addEventListener('click', () => {
            // Check if already visible
            if (diagnosticsPanel.classList.contains('hidden')) {
                // Show panel
                diagnosticsPanel.classList.remove('hidden');
                actionBtn.querySelector('span').textContent = 'Collapse Diagnostics';
                
                // Animate logs cascadingly
                logItems.forEach((item, index) => {
                    item.style.opacity = '0';
                    item.style.transform = 'translateX(-10px)';
                    item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateX(0)';
                    }, (index + 1) * 200);
                });
            } else {
                // Hide panel
                diagnosticsPanel.classList.add('hidden');
                actionBtn.querySelector('span').textContent = 'Run System Diagnostics';
            }
        });
    }
});
