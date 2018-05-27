$(document).ready(function()
{
    getProjects().then(function(data)
    {
        var template = $('#hidden-project-template').clone(); //.html();
        // remove ids and hidden style
        template.removeAttr('id');
        template.removeAttr('style');

        $.each(data.Projects, function( index, project ) {
            var card = buildCard(template, project);
            $('#project-list').append(card);
          });

        //$('#project-list').append(template);
    })
});


getProjects = function()
{
    var promise = $.getJSON( "Projects/bootcamp.json", function( data ) {
        return data.Projects;
    });

    return promise;
}

buildCard = function (template, project)
{
    var item = template.clone();

    item.find('#title').text(project.Title);
    item.find('#subtitle').text(project.Subtitle);
    item.find('#description').text(project.Description);
    item.find('#iteration').text(project.Iteration);
    item.find('#number-volunteers').text(project.Volunteers);
    var progress = item.find('#progress-bar');
    progress.find('.progress-bar')
    .attr('style','width: ' + project.Progress + '%')
    .attr('aria-valuenow', project.Progress);
    // process skills
    var skillsContainer = item.find('#skills-container');
    skillsContainer.empty();
    $.each(project.Skills, function( index, skill ) {
        skillsContainer.append('<a href="#" class="badge badge-secondary">'+skill+'</a> ');
    });


    item.find('#join-project-btn').attr('href', project.JoinURL);

    imageExists(project.Image, function(exists)
    {    
        if(exists)
        {
            item.find('#image').attr('src', project.Image);
            item.find('#image').removeAttr('data-src');
        }
        else 
        {
            var backup = getBackupImage(project.Type) + project.Title
            item.find('#image').attr('data-src', backup);
            Holder.run(item.find('#image'));
        }

      });

    return item;

}

imageExists = function (url, callback) {
    var img = new Image();
    img.onload = function() { callback(true); };
    img.onerror = function() { callback(false); };
    img.src = url;
  }


backupImages = 
{
  "AI" : "holder.js/100px225?bg=24a6f2&fg=eceeef&text=",
  "GameDev" : "holder.js/100px225?bg=8948f2&fg=eceeef&text=",
  "Web": "holder.js/100px225?bg=bc2da7&fg=eceeef&text=",
  "Infrastructure": "holder.js/100px225?bg=38bc6b&fg=eceeef&text=",
  "Robotics": "holder.js/100px225?bg=bc3a12&fg=eceeef&text="
}

getBackupImage = function(type)
{
    var str = backupImages[type];

    if(str == undefined)
    {
        return "holder.js/100px225?theme=thumb&bg=55595c&fg=eceeef&text="
    }

    return str;
}

