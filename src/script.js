document.addEventListener('DOMContentLoaded', function() {
  document.body.onclick = click;
})

function click(event) {
  if(event.target.closest('.e-accordion__short')){
    showAccordeon(event.target);
  }
  if(event.target.closest('.onoffswitch')) {
    onoffswitch();
  }
} 

function showAccordeon(target) {
  if(target.classList.contains('history__show')) {
    if(!target.nextElementSibling.classList.contains('history__hide')) {
      target.nextElementSibling.classList.toggle('history__hide');
      return;
    }
    document.querySelectorAll('.e-accordion__more').forEach(item => {
      if(!item.classList.contains('history__hide')) {
        item.classList.toggle('history__hide');
      }
    });
    target.nextElementSibling.classList.toggle('history__hide');
  }
  else {
    showAccordeon(target.parentElement);
  }
};

function onoffswitch() {
    document.querySelectorAll('.theme').forEach(element => {
      if(!element.classList.contains('theme_color_project-warning') && !element.classList.contains('theme_color_project-brand')) {
        element.classList.toggle('theme_color_project-default');
        element.classList.toggle('theme_color_project-inverse');
      }
    })
  };