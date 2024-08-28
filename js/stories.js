"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDelBtn = false) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  const showFavBtn = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
        ${showFavBtn ? applyFavBtn(story,currentUser) : ''}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
        ${showDelBtn ? applyDelBtn() : ''}
      </li>
    `);
}

// Story Delete button call upon story creation
function applyDelBtn() {
  return `
      <a class = 'delete-button'><small>Delete</small></a>`
}

// Story Favorite button call upon story creation
function applyFavBtn(story, user) {
  const isItFav = user.checkFavorites(story);
  const favProperty = isItFav ? 's' : 'r'
  return `
  <span class = 'fav-btn'>
    <i class="fa${favProperty} fa-heart"></i>
  </span>` 
}

// Story Deletion upon button push
async function delStory(evt){
  console.debug('Deleting story');

  const $closestLi = $(evt.target).closest('li');
  const storyId = $closestLi.attr('id');

  await storyList.deleteStory(currentUser,storyId);

  await putStoriesOnPage();
}

$userStories.on('click','.delete-button', delStory)

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

function showUserStories(){
  console.debug('Showing User stories');

  hidePageComponents();
  $userStories.empty();

  if (currentUser.ownStories.length === 0){
    $userStories.append('<h4>You need to submit a story to see them in this section</h4>');
  } else {
    for (let s of currentUser.ownStories){
      let $story = generateStoryMarkup(s,true);
      $userStories.append($story);
    }
  }
  $userStories.show()
}

// Submitting a new Story
async function newStorySubmission(evt){
  evt.preventDefault();
  console.debug('SubmittingStory')

  // Pull information that will be submitted to the story creator
  const author = $('#author-creation').val();
  const title = $('#title-creation').val();
  const url = $('#url-creation').val();
  const username = currentUser.username

  // Set data into appropriate structure
  const storyData = {title, url, author, username };

  // add to StoryList with appropriate markup
  const story = await storyList.addStory(currentUser, storyData);
  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);
  $submissionForm.hide();
  $allStoriesList.show();
}

$submissionForm.on('submit', newStorySubmission);

// Show the favorited stories when the Nav option is clicked
function showFavoriteStories() {
  console.debug('Showing Favorites');
  $favoriteStories.empty();

  if (!currentUser.favorites.length) {
    $favoriteStories.append("<h4>No Favorites Yet!</h4>");
  } else{
    for (let story of currentUser.favorites){
      const storyMarkup = generateStoryMarkup(story);
      $favoriteStories.append(storyMarkup);
    }
  }
  
  $favoriteStories.show();
}

// Toggle whether something is a favorite on the story
async function toggleFavorite(evt){
  console.debug('toggling favorite');

  const $target = $(evt.target);
  const $closestLi = $target.closest('li');
  const storyId = $closestLi.attr('id');
  const story = storyList.stories.find(s => s.storyId === storyId);

  // Check current state of story to see if it is already favorited
  if ($target.hasClass('fas')){
    // if favorited, you want to remove from favorites
    await currentUser.removeFav(story);
    $target.closest('i').toggleClass('fas far');
  } else {
    // if not favorited, favorite it
    await currentUser.addToFavorites(story);
    $target.closest('i').toggleClass('fas far');
  }

}

$storiesContainer.on('click', '.fav-btn', toggleFavorite)