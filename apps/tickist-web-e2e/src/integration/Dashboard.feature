Feature: Tickist Dashboard feature

  Tickist Dashboard features

  Background: Tickist has firebase with data
    Given Login into Firebase
    Given Remove old firebase data
    Given Set firebase data

  Scenario: Dashboard page should display:
    Given I go on page "/dashboard"
#    When I see status updated
#    Then I see CU status with id "100"
#    And I see CU name "CuName"
#    And I see CU status "On Air"
#    And I see Cu alarms count "0"
#    And I see "All enabled" on air status



