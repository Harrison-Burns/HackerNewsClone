"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

// Brings user to a submission option for a new story
function navSubmissionForm (evt) {
  console.debug('navSubmissionForm',evt);
  hidePageComponents();
  $submissionForm.show();
}

$submit.on('click',navSubmissionForm);

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  putStoriesOnPage();
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}

// Favorites option functionality
function showMyFavorites (evt) {
  console.debug('Favorite Stories',evt);
  hidePageComponents();
  showFavoriteStories();
}

$body.on('click', '#nav-fav', showMyFavorites);

// My stories option functionality
function showMyStories (evt) {
  console.debug('My Stories', evt);
  hidePageComponents();
  showUserStories();
}

$body.on('click', '#my-stories', showMyStories);

// User profile option functionality
function showUserProfile (evt) {
  console.debug ('User Profile', evt);
  hidePageComponents();
  $navUserProfile.show();
}

$navUserProfile.on('click', showUserProfile);
