// your_script.js
$(document).ready(function () {
    // Initialize the DataTable
    const dataTable = $('#fileTable').DataTable();

    // Handle form submission
    $('#dataForm').submit(function (event) {
        event.preventDefault();

      // Prepare the data to be sent to the server
        const formData = new FormData(this);
        
      // Send the form data (including the file) to the server using AJAX
        $.ajax({
            type: 'POST',
            url: '/upload',
            data: formData,
            processData: false,
            contentType: false,
            success: function (data) {
                // On success, add the data to the DataTable
                console.log('i am here')
                const row = $('<tr>');
                row.append($('<td>').text(formData.get('name')));
                row.append($('<td>').text(formData.get('age')));
                row.append($('<td>').text(formData.get('city')));
                row.append($('<td>').text(data.fileName));
                row.append($('<td>').html(`<a href="${data.filePath}">Download</a>`));

                dataTable.row.add(row).draw();
            },
            error: function (error) {
                console.error(error);
            },
        });

      // Reset the form
        this.reset();
    });
});
