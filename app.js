const pdfInput = document.getElementById('pdfDocuments');
const pdfForm = document.getElementById('pdfForm');
const pdfReport = document.getElementById('pdfReport');

const documents = [];


const loadPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
    }).promise;

    return pdf;
};

const renderPDF = async () => {
    
    pdfForm.innerHTML = '';
    for (const pdfDocument of documents) {
        const documentElement = document.createElement('div');
        documentElement.classList.add( 'border', 'rounded', 'p-3', 'mb-3' );
        documentElement.innerHTML = `
        <h3>${pdfDocument.name}</h3> 
        <p> Número de páginas: <strong>${pdfDocument.pages}</strong> </p> 
        <div class="mb-3"> 
            <label for="valuePerPage-${pdfDocument.id}" class="form-label" > Valor por página: </label> 
            <input type="number" id="valuePerPage-${pdfDocument.id}" class="form-control" min="0" step="0.01" value="${pdfDocument.valuePerPage}" > 
        </div> 
        <div class="mb-3">
            <label for="pdfCopies-${pdfDocument.id}" class="form-label" > Número de cópias: </label> 
            <input type="number" id="pdfCopies-${pdfDocument.id}" class="form-control" min="1" value="${pdfDocument.numberOfCopies || 1}" > 
        </div>
        <div class="mb-3"> 
            <label for="impressionType-${pdfDocument.id}" class="form-label" > Tipo de impressão: </label> 
            <select id="impressionType-${pdfDocument.id}" class="form-select" > 
                <option value="color" ${pdfDocument.impressionType === 'color' ? 'selected' : ''} > Colorida </option> 
                <option value="blackAndWhite" ${pdfDocument.impressionType === 'blackAndWhite' ? 'selected' : ''} > Preto e Branco </option> 
            </select> 
        </div>
        `;
        pdfForm.appendChild(documentElement);
    };
    const submitButton = document.createElement('button'); 
    submitButton.type = 'submit'; 
    submitButton.classList.add('btn', 'btn-primary',); 
    submitButton.textContent = 'Gerar relatório'; 
    pdfForm.appendChild(submitButton);
};

const updateDocumentValue = (documentId, value) => {
    const pdfDocument = documents.find(doc => doc.id === documentId);
    if (pdfDocument) {
        pdfDocument.valuePerPage = parseFloat(value); 
    }
};

const updateDocumentImpressionType = (documentId, impressionType) => {
    const pdfDocument = documents.find(doc => doc.id === documentId);
    if (pdfDocument) {
        pdfDocument.impressionType = impressionType;
    }
};

const updateDocumentCopies = (documentId, copies) => {
    const pdfDocument = documents.find(doc => doc.id === documentId);
    if (pdfDocument) {
        pdfDocument.numberOfCopies = parseInt(copies);
    }
};

const calculateTotalCost = (pdfDocument) => {
    if (!pdfDocument) return 0;
    return pdfDocument.pages * pdfDocument.valuePerPage * (pdfDocument.numberOfCopies || 1);
};

const renderReport = async () => {
    const reportObject = {
        id: crypto.randomUUID(),
        title: `Relatório ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`,
        createdAt: new Date().toISOString(),
    };
    

    pdfReport.innerHTML = '';
    const reportTitle = document.createElement('h2');
    reportTitle.textContent = `${reportObject.title}`;
    pdfReport.appendChild(reportTitle);

    const downloadButton = document.createElement('button');
    downloadButton.classList.add('btn', 'btn-success');
    downloadButton.textContent = 'Baixar Relatório';

    let totalCost = 0;
    

    for (const pdfDocument of documents) {
        const documentCost = await calculateTotalCost(pdfDocument);
        totalCost += documentCost;
        
        const documentReport = document.createElement('div');
        documentReport.classList.add('border', 'rounded', 'p-3', 'mb-3');
        documentReport.innerHTML = `
        <h4>${pdfDocument.name}</h4> 
        <p> Páginas: <strong>${pdfDocument.pages}</strong> </p> 
        <p> Valor por página: <strong> R$ ${pdfDocument.valuePerPage.toFixed(2)} </strong> </p> 
        <p> Número de cópias: <strong> ${pdfDocument.numberOfCopies || 1} </strong> </p>
        <p> Tipo: <strong> ${ pdfDocument.impressionType === 'color' ? 'Colorida' : 'Preto e Branco' } </strong> </p> 
        <p> Subtotal: <strong> R$ ${documentCost.toFixed(2)} </strong> </p>
        `;
        pdfReport.appendChild(documentReport);
    }

    // adicionando os documentos e valor do relatorio
    reportObject['documents'] = documents.map(doc => ({
            name: doc.name,
            pages: doc.pages,
            valuePerPage: doc.valuePerPage,
            numberOfCopies: doc.numberOfCopies,
            impressionType: doc.impressionType,
            subtotal: calculateTotalCost(doc),
        }))
    reportObject['totalCost'] = totalCost;

    
    const totalCostElement = document.createElement('h3');
    totalCostElement.textContent = `Custo Total: R$ ${totalCost.toFixed(2)}`;
    pdfReport.appendChild(totalCostElement);
    
    const reportTitleInput = document.createElement('input');
    reportTitleInput.classList.add('mb-3');
    reportTitleInput.type = 'text';
    reportTitleInput.classList.add('form-control');
    reportTitleInput.id = `reportId-${reportObject.id}`;
    reportTitleInput.placeholder = 'Título do relatório';

    
    pdfReport.appendChild(reportTitleInput);
    pdfReport.appendChild(downloadButton);
    
    
    downloadButton.addEventListener('click', () => {
        
        if (reportTitleInput.value.length > 1) {
            reportObject.title = `${reportTitleInput.value} - ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`;
        };
        saveReportToLocalStorage(reportObject);
        generateReportPDF(reportObject);
        
    })

};

const saveReportToLocalStorage = (report) => {
    const existingReports = JSON.parse(localStorage.getItem('reportsList')) || [];
    existingReports.push(report);
    localStorage.setItem('reportsList', JSON.stringify(existingReports));
}

const generateReportPDF = (report) => {
    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF();

    pdf.setFontSize(18);
    pdf.text('Relatório de Impressão', 20, 20);

    pdf.setFontSize(12);

    let y = 35;

    for (const document of report.documents) {
        pdf.text(`Documento: ${document.name}`, 20, y);
        y += 8;

        pdf.text(`Páginas: ${document.pages}`, 20, y);
        y += 8;

        pdf.text(`Cópias: ${document.numberOfCopies}`, 20, y);
        y += 8;

        pdf.text(
            `Valor por página: R$ ${document.valuePerPage.toFixed(2)}`,
            20,
            y
        );
        y += 8;

        pdf.text(
            `Subtotal: R$ ${document.subtotal.toFixed(2)}`,
            20,
            y
        );

        y += 15;
    }

    pdf.setFontSize(14);
    pdf.text(
        `Total: R$ ${report.totalCost.toFixed(2)}`,
        20,
        y
    );

    pdf.save(`${report.title}.pdf`);
};

document.addEventListener('DOMContentLoaded', async () => {
    pdfInput.addEventListener('change', async (event) => {
        const files = event.target.files;
        for (const file of files) {
            const pdfDocument = {
                id: crypto.randomUUID(),
                file: file,
                name: file.name,
                pages: null,
                valuePerPage: 0,
                impressionType: 'color',
                numberOfCopies: 1,
            }

            try {
                const pdf = await loadPDF(file);
                pdfDocument.pages = pdf.numPages;
                documents.push(pdfDocument);
            }
            catch (error) {
                console.error(`Error loading PDF ${file.name}:`, error);
            }

        }
        renderPDF();
        const clearPage = document.createElement('button');
        clearPage.type = 'button';
        clearPage.classList.add('btn', 'btn-danger', 'm-3');
        clearPage.textContent = 'Limpar documentos';
        
        clearPage.addEventListener('click', () => {
            window.location.reload();
        });
        pdfForm.appendChild(clearPage);
    });
    
    pdfForm.addEventListener('input', (event) => {
        const target = event.target;
        if (target.matches('input[id^="valuePerPage-"]')) {
            const documentId = target.id.replace('valuePerPage-', '');
            updateDocumentValue(documentId, target.value);
            console.log('Updated documents:', documents);
        }
        if (target.matches('input[id^="pdfCopies-"]')) {
            const documentId = target.id.replace('pdfCopies-', '');
            updateDocumentCopies(documentId, target.value);
            console.log('Updated documents:', documents);
        }
    });



    pdfForm.addEventListener('change', (event) => {
        if (!event.target.matches('select')) {
            return;
        }
        const documentId = event.target.id.replace('impressionType-', '');
        updateDocumentImpressionType(documentId, event.target.value);
        console.log('Documents after input and change events:', documents);
    });

    pdfForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        let totalCost = 0;
        for (const pdfDocument of documents) {
            const documentCost = await calculateTotalCost(pdfDocument);
            totalCost += documentCost;
        }
        renderReport();

    });


});