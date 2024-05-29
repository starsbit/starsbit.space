# Why would you even need to load resources before the content is displayed to the user?

Often its enough to load the resources for a page after the page has been displayed. This should be the default behavior for most pages. However, there are some pages where it makes sense to load the resources before the page is displayed. For example, if you have a page that is very resource intensive, you may want to load the resources before the page is displayed so that the user doesn't have to wait for the resources to load before they can interact with the page. Another case is if you work with certain animation libraries that require the resources to be loaded before triggering the animation.

On this website I used the animation library `gsap`. There are images that need to be animated on this page and `gsap` only triggered the animation for me when the images were fetched. This coupled with the fact that I use a free hosting service that has a slow response time, I decided to load the resources before the page is displayed. This way the user does not see a page with broken images and a random animation trigger long after first seeing the page.

# How can you load resources before the page is displayed in Angular?

I solved this problem by utilizing the 'deferrable views' with the `@defer` keyword. 

"Deferrable views can be used in component template to defer the loading of select dependencies within that template. Those dependencies include components, directives, and pipes, and any associated CSS. To use this feature, you can declaratively wrap a section of your template in a `@defer` block which specifies the loading conditions." - Angular Docs

