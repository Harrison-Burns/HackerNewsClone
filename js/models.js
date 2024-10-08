"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    return new URL(this.url).host;
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user,{title, author, url}) {
    // Finds the login token created by user
    const token = user.loginToken

    // function to POST info which follows quickstart rules
    const response = await axios({
      method: 'POST',
      url: `${BASE_URL}/stories`,
      // line for line from request page
      data: {token, story: {author, title, url}},
    })

    // creates a new Class obj with all the data
    const story = new Story(response.data.story);
    // Adds the new obj to *front ofthe StoryList
    this.stories.unshift(story);

    // Add User's own stories
    user.ownStories.unshift(story)
    return story;
  }

  // Deleting a story function with Delete request
  async deleteStory (user, storyId) {
    const token = user.loginToken;
    await axios({
      url:`${BASE_URL}/stories/${storyId}`,
      method: 'DELETE',
      data: {token: user.loginToken}
    })

    // Remove unwanted stories from all aspects of the page
    this.stories = user.ownStories.filter(s=> s.storyId !== storyId)
    user.ownStories = user.ownStories.filter(s=> s.storyId !== storyId)
    user.favorites = user.favorites.filter(s=> s.storyId !== storyId);
  }
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

    // Create funcitonality for adding and removing things from the favorites
    async addToFavorites(story) {
      this.favorites.push(story);
      await this.toggleFavorite('add',story);
    }

    async removeFav(story) {
      this.favorites = this.favorites.filter(story => !story.storyId === story.storyId);
      await this.toggleFavorite('remove', story);
    }

    async toggleFavorite(toggleSet,story) {
      let method;
      if (toggleSet === 'add'){
        method = 'POST';
      } else if (toggleSet === 'remove') {
        method = 'DELETE';
      };
      const token = this.loginToken;
      await axios({
        url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
        method: method,
        data:{token},
      })
    }

    // function for identifying if story is already favorited
    checkFavorites(story){
      return this.favorites.some(s => (s.storyId === story.storyId));
    }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    try {
      const response = await axios({
        url: `${BASE_URL}/login`,
        method: "POST",
        data: { user: { username, password } },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        response.data.token
      );
    } catch (err) {
      console.error('Username and Password do not match any on file', err)
      return null;
    }
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }
}

