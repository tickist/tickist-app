Feature: Tickist task feature

  Task features

  Background: Tickist has firebase with data
    Given Mock CU with default data

  Scenario: Create new task with specific name
    Given I go on "/status"
    When I see status updated
    Then I see CU status with id "100"
    And I see CU name "CuName"
    And I see CU status "On Air"
    And I see Cu alarms count "0"
    And I see "All enabled" on air status



