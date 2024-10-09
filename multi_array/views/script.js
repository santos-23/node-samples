function getImageUrl(filename) {
    return '/uploads/' + filename;
  }
  $(document).ready(function() {
    const dataTable = $('#imageTable').DataTable({
      "paging":true,
      "pageLength": 2,
      // "scrollY":"300px",
      columns: [
      { 
        data: 'imageUrl',
        render: function(data, type, row) {
          return '<a href="'+ data +'"> <img src="' + data + '" alt="' + row.name + '"></a>';
        }
      },
      { data: 'name' },
      { data: 'id'},
      { data: 'age' },
      { data: 'position'},
      { data: 'phone' },
      { data: 'address' },
      { data: 'skills' },
      { data: 'qualification' },
      { data: 'uploadedAt' }
    ]
    });

    $('#uploadForm').on('submit', function(event) {
      event.preventDefault();

      const formData = new FormData();
      const imageFile = $('#imageFile')[0].files[0];
      const name = $('#name').val();
      const id = $('#id').val();
      const age = $('#age').val();
      const position = $('#position').val();
      const phone = $('#phone').val();
      const address = $('#address').val();
      const skills = $('#skills').val();
      const qualification = $('#qualification').val();
      

      if (!imageFile || !name) {
        alert('Please select an image and enter a name to upload.');
        return;
      }

      formData.append('image', imageFile);
      formData.append('name', name);
      formData.append('id', id);
      formData.append('age', age);
      formData.append('position', position);
      formData.append('phone', phone);
      formData.append('address', address);
      formData.append('skills', skills);
      formData.append('qualification', qualification);
      

      $.ajax({
        url: '/api/upload',
        type: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        success: function(data) {
          console.log(data);
          fetchImageData();
        },
        error: function(error) {
          console.error('Error uploading image:', error);
        }
      });
    });

    function fetchImageData() {
      $.ajax({
        url: '/api/images',
        type: 'GET',
        success: function(data) {
          dataTable.clear();
          dataTable.rows.add(data);
          dataTable.draw();
        },
        error: function(error) {
          console.error('Error fetching image data:', error);
        }
      });
    }

    fetchImageData();
  });
