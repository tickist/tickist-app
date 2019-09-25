Feature: Tickist user features

  User features

  Scenario: Create new user
    Given I go on page
    When I fill registration form
    And I click on "Sign up for free" button
    Then I am logged in
#    Then I go on "/"
#    And I see dashboard
