$(document).ready(function () {
    populatePage();
});


createTagsFilter = function()
{
    //<a href="#" class="badge badge-secondary" onclick="myFunction(this)">CSS</a>

}

populatePage = function () {

    getVolunteerResponses().then(function (responses) {
        var projectVolunteers = {};

        $.each(responses, function (index, volunteer) {
            var projectName = volunteer.Project;

            if (projectVolunteers[projectName] === undefined) {
                projectVolunteers[projectName] = 0;
            }

            projectVolunteers[projectName]++;
        });

        var yourProject = $('#your-project').clone();
        $('#your-project').remove();
        // Initialize how many projects are currently available for people to work on
        $('#project-list').append("<div id='available-projects' hidden=''>" + 0 + "</div>");
        getProjects().then(function (projects) {

            // copy your project element

            // copy template
            var template = $('#hidden-project-template').clone(); //.html();
            // remove ids and hidden style
            template.removeAttr('id');
            template.removeAttr('style');

            projects.sort(function(a,b) {
                return a.order - b.order;
            });

            $.each(projects, function (index, project) {
                try {
                    if(project.show === "FALSE") { return true; }

                    project.volunteersNumber = projectVolunteers[project.title];
                    projects[index].id = index;
                    var card = buildCard(template, project);
                    $('#project-list').append(card);
                    // Increment available projects count
                    $('#available-projects').text(parseInt($('#available-projects').text()) + 1);
                }
                catch (err) {
                    console.error(err);
                }
            });
            truncateDescriptionLight();

            yourProject.removeAttr('id');
            yourProject.removeAttr('style');
            $('#project-list').append(yourProject);
        })
    })
}

getProjects = function () {
    var defer = $.Deferred();
    var url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRIvZ-gagyX1vOU_9PcT_83xeJHid6pet3CxyxSVlbwUPBHOhyIjTi5i-qOEa3oKWU2xpKhRalp_ccn/pub?gid=0&single=true&output=tsv';
    $.get(url, function (tsvData) {
        var projects = $.tsv.toObjects(tsvData);
        defer.resolve(projects);
    });

    return defer;
}

getVolunteerResponses = function () {
    var defer = $.Deferred();
    var url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRIvZ-gagyX1vOU_9PcT_83xeJHid6pet3CxyxSVlbwUPBHOhyIjTi5i-qOEa3oKWU2xpKhRalp_ccn/pub?gid=1796291565&single=true&output=tsv';
    $.get(url, function (tsvData) {
        var projects = $.tsv.toObjects(tsvData);
        defer.resolve(projects);
    });

    return defer;
}

buildCard = function (template, project) {
    var item = template.clone();

    var color = getProjectColor(project.type);

    item.attr('id', 'project-card-'+project.id);

    var projectType = item.find('#project-type');
    projectType.css({ 'background-color': color });
    projectType.text(project.type);

    var titleLine = item.find(".title-line");
    titleLine.css({ 'border-color': color });

    var title = item.find('#title');
    title.text(project.title);
    title.css({ 'color': color });

    item.find('#subtitle').text(project.type)
    .css({'color': color});

    var description = item.find('#description-id');
    description.attr('id', 'description-id-' + project.id);

    description.find('span').text(project.description);
    
    item.find('#iteration').text(project.iteration);

    var number = project.volunteersNumber === undefined ? 0 : project.volunteersNumber;
    item.find('#volunteers-number').text(number)
    item.find('#volunteers-needed').text(project.volunteersNeeded);

    var progress = item.find('#progress-bar');
    progress.find('.progress-bar')
        .attr('style', 'width: ' + project.progress + '%')
        .attr('aria-valuenow', project.progress)
        .css({'background-color': color});

    // process skills
    var skillsContainer = item.find('#skills-container');
    skillsContainer.empty();
    $.each(project.skills.split(","), function (index, skill) {
        skill = skill.trim();
        if(projectTags[skill] === undefined)
        {
            projectTags[skill] = [];
        }
        projectTags[skill].push(project.id);
	    // Changed href=# to onclick, which has the side effect of turning the text black, as it inherits .a:not({href}):not{[tabindex]{ color: inherit }, which overwrites color:[#fff]
        skillsContainer.append('<a onclick="return filter(\'' + skill + '\')" class="badge badge-secondary" id="skill-' + index + '">' + skill + '</a> ');
    });
    // This will add a hidden skill count to the card, which allows us to find the elements
    skillsContainer.append( '<div id="skill-count" hidden="">' + (project.skills.split(",")).length +  '</div>');

    var joinUrl = project.joinProjectUrl;

    if(joinUrl == "")
    {
        joinUrl = "https://docs.google.com/forms/d/e/1FAIpQLSctyjqTwUGLmiAFQLewZwlHSkPzl-5REKhu1UjMuGTF6rCWQA/viewform?usp=pp_url&entry.1639891366=";
        joinUrl += project.title.replace(" ", "+");
    }
    item.find('#join-project-btn').attr('href', joinUrl);
    item.find('#join-project-btn').css({'background-color': color, 'border-color': color});

    if(project.projectUrl === "")
    {
        item.find('#project-page-btn').remove();
    }

    // No images on cards - saving code as backup
    // imageExists(project.image, function (exists) {
    //     if (exists) {
    //         item.find('#image').attr('src', project.image);
    //         item.find('#image').removeAttr('data-src');
    //     }
    //     else {
    //         var backup = getBackupImage(project.type) + project.title
    //         item.find('#image').attr('data-src', backup);
    //         Holder.run(item.find('#image'));
    //     }
    //});

    return item;

}

filter = function(filterSkill) {
    // Iterate through each project card
        // if the project card does NOT have the skill, we hide/unhide it
        // if the card HAS the skill, we add the attribute "selected" to the class for the skill.
        //
    //
    projCount =parseInt($('#available-projects').text());
    for(var currentProj = 0; currentProj < projCount; currentProj++)
    {
        card = $('#project-card-' + currentProj);
        var skillsContainer = card.find('#skills-container');
        var skillsCount =parseInt(skillsContainer.find('#skill-count').html());
        var i;
        var found=false;
        for(i = 0; i < skillsCount ; i++)
        {
            var skillObj = skillsContainer.find('#skill-' + i );
            if (skillObj.html() == filterSkill)
            {
                // Mark it found so we know card has been processed
                found = true;
                // If the card has the skill, mark it selected
                var selected = "Selected";
                 // If the card has the skill, and was previously selected, we need to unfilter it so it is actually visible again
                if(skillObj.hasClass(selected))
                {
                    skillObj.removeClass(selected);
                }
                else
                {
                    skillObj.addClass(selected);
                }
            }
        }
        if (!found)
        {
            // Toggle the cards visibility
            card.toggle();
        }
    }
}

imageExists = function (url, callback) {
    var img = new Image();
    img.onload = function () { callback(true); };
    img.onerror = function () { callback(false); };
    img.src = url;
}

projectTags = {}

backupImages = {
    "AI": "holder.js/100px225?bg=24a6f2&fg=eceeef&text=",
    "GameDev": "holder.js/100px225?bg=8948f2&fg=eceeef&text=",
    "Web": "holder.js/100px225?bg=bc2da7&fg=eceeef&text=",
    "Infrastructure": "holder.js/100px225?bg=38bc6b&fg=eceeef&text=",
    "Robotics": "holder.js/100px225?bg=bc3a12&fg=eceeef&text="
}

projectTypeColor = {
    "AI": "#24a6f2",
    "GameDev": "#8948f2",
    "Web": "#bc2da7",
    "Infrastructure": "#38bc6b",
    "Robotics": "#bc3a12",
    "Curriculum": "#24a6f2",
    "Bootcamp" : "#8948f2",
}

getBackupImage = function (type) {
    var str = backupImages[type];

    if (str == undefined) {
        return "holder.js/100px225?theme=thumb&bg=55595c&fg=eceeef&text="
    }

    return str;
}

getProjectColor = function(type)
{
    var str = projectTypeColor[type];

    if (str == undefined) {
        return '#606060'
    }

    return str;
}

truncateDescription = function (id)
{
    var tId = id;
    var xmpl = $('#description-id-' + tId);

    var toggle = xmpl.find('.toggle');
    //toggle.removeClass('toggle');
    toggle.addClass('toggle-'+tId);

    xmpl.dotdotdot({
        // Prevents the <a class="toggle" /> from being removed
        keep: '.toggle'
    })
    // Get the dotdotdot API
    var api = xmpl.data('dotdotdot');
    xmpl.on(
        'click',
        '.toggle',
        function (e) {
            e.preventDefault();
            //	When truncated, restore
            if (xmpl.hasClass('ddd-truncated')) {
                api.restore();
                xmpl.addClass('full-story');
            }
            //	Not truncated, truncate
            else {
                xmpl.removeClass('full-story');
                api.truncate();
                api.watch();
            }
        }
    );
}


truncateDescriptionLight = function(id)
{
    var showChar = 130;
	var ellipsestext = "...";
	var moretext = "... more";
	var lesstext = "... less";
	$('.more').each(function() {
		var content = $(this).html();

		if(content.length > showChar) {

			var c = content.substr(0, showChar);
			var h = content.substr(showChar, content.length - showChar);

			var html = c + '<span class="moreellipses">&nbsp;</span><span class="morecontent"><span>' + h + '</span>&nbsp;&nbsp;<a href="" class="morelink">' + moretext + '</a></span>';

			$(this).html(html);
		}

	});

	$(".morelink").click(function(){
		if($(this).hasClass("less")) {
			$(this).removeClass("less");
			$(this).html(moretext);
		} else {
			$(this).addClass("less");
			$(this).html(lesstext);
		}
		$(this).parent().prev().toggle();
		$(this).prev().toggle();
		return false;
	});
}


myFunction = function(e)
{
    //e.preventDefault();
    console.log(e);

    var tag = $(e).text();
    var allProjects = $('[id^="project-card-"]')

    $.each(allProjects, function (index, project)
    {
        $(project).hide();
    });

    var idList = projectTags[tag];
    $.each(idList, function (index, id)
    {
        $('#project-card-' + id).show();
    });
}
