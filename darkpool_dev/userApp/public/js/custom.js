jQuery(document).ready(function () {

    // use sctict mode js
    "use strict";

    /* ========================================================================= */
    /*	Page Preloader
    /* ========================================================================= */

    // window.load = function () {
    // 	document.getElementById('preloader').style.display = 'none';
    // }

    /*** =====================================
     * Cryptocurrency
     * =====================================***/
    $('.cryptocurrency-slide').owlCarousel({
        autoplay: false,  // 控制币价滚动
        loop: false,
        margin:30,
        dots: false,
        responsiveClass:true,
        nav: true,
        navText:[
            "<i class='ion-ios-arrow-back'></i>",
            "<i class='ion-ios-arrow-forward'></i>"
        ],
        responsive:{
            0:{
                items:1,
                nav:true
            },
            600:{
                items:3,
                nav:true,
                autoplay: false,
                dots: true
            },
            1000:{
                items:5,
                nav:true,
                loop:false,
            }
        }
    });
    /*** =====================================
     * Testimonial
     * =====================================***/
    $('.testimonial-slider').owlCarousel({
        autoplay: true,
        loop:true,
        margin:0,
        dots: false,
        nav: false,
        responsiveClass:true,
        navText:[
            "<i class='ion-ios-arrow-back'></i>",
            "<i class='ion-ios-arrow-forward'></i>"
        ],
        responsive:{
            0:{
                items:1,
                nav:true
            },
            600:{
                items:1,
                nav:false
            },
            1000:{
                items:1,
                nav:false,
                loop:false
            }
        }
    });

    /*** =====================================
     * Parallax
     * =====================================***/
    if( $('.parallax-section').length ){
        $('.parallax-section').parallax("70%", 0.3);
    }

    /*** =====================================* Contact Form submission* =====================================*/
    $(function() {
        $('form#contact').on('submit', function(e) {
            e.preventDefault();
            $.post('post-contact-form.php', $(this).serialize()).done(function(data) {
                $('.contact-form').fadeOut('slow', function() {
                    $('.contact-form').fadeIn('slow').html(data);
                });
            }).fail(function() {
                alert('Failed to submit. Please Try again.');
            });
        });
    });
    /**
     * =====================================
     * wow Js
     * =====================================
     */
    var wow=new WOW( {
            boxClass: 'wow', // animated element css class (default is wow)
            animateClass: 'animated', // animation css class (default is animated)
            offset: 0, // distance to the element when triggering the animation (default is 0)
            mobile: false, // trigger animations on mobile devices (default is true)
            live: true, // act on asynchronously loaded content (default is true)
            callback: function(box) {}
            , scrollContainer: true // optional scroll container selector, otherwise use window
        }
    );
    wow.init();


    // /** =====================================
    //  *   Search Box
    //  * =====================================**/

    $('.search-option a').on('click', function (e) {
        e.preventDefault();
        $('.input-search-area').slideDown().addClass('show');
    });
    $('.close-button').on('click', function () {
        $('.input-search-area').slideUp().removeClass('show');
    });

    // /** =====================================
    //  *   Search Box
    //  * =====================================**/
    // $('.search-click a').on('click', function(e) {
    //     e.preventDefault();
    //     $('.input-search-area').slideDown().addClass('show');
    // });
    // $('.close-button').on('click', function(){
    //     $('.input-search-area').slideUp().removeClass('show');
    // });



});

function stickyHeader () {
    if ($('.stricky').length) {
        var strickyScrollPos = 100;
        if($(window).scrollTop() > strickyScrollPos) {
            $('.stricky').removeClass('fadeIn animated');
            $('.stricky').addClass('stricky-header fadeInDown animated');
        }
        else if($(this).scrollTop() <= strickyScrollPos) {
            $('.stricky').removeClass('stricky-header fadeInDown animated');
            $('.stricky').addClass('slideIn animated');
        }
    };
}
// instance of fuction while Window Scroll event
jQuery(window).scroll(function () {
    (function ($) {
        stickyHeader();
    })(jQuery);
});



jQuery(window).on('load', function() {
    /** =====================================
     * Preloder
     * =====================================*/
    $('.loading').fadeOut();
});


