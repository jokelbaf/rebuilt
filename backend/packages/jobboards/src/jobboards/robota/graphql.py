from typing import Any

from ..types import SearchFilters

REMOTE_SCHEDULE_ID = "3"

SEARCH_QUERY = (
    "query getPublishedVacanciesList("
    "$filter: PublishedVacanciesFilterInput!, "
    "$pagination: PublishedVacanciesPaginationInput!, "
    "$sort: PublishedVacanciesSortType!) {"
    " publishedVacancies(filter: $filter, pagination: $pagination, sort: $sort) {"
    " totalCount"
    " items {"
    " id title description sortDateText"
    " salary { amount amountFrom amountTo comment }"
    " company { id name logoUrl }"
    " city { id name }"
    " schedules { id }"
    " badges { name }"
    " publicationType }"
    " } }"
)

DETAIL_QUERY = (
    "query getPublishedVacancy($id: ID!, $trackView: Boolean) {"
    " publishedVacancy(id: $id, trackView: $trackView) {"
    " id title description fullDescription sortDate sortDateText"
    " salary { amount amountFrom amountTo comment }"
    " company { id name logoUrl companyUrl }"
    " city { id name }"
    " schedules { id name }"
    " badges { name }"
    " publicationType isActive"
    " } }"
)


def search_variables(filters: SearchFilters, page_size: int) -> dict[str, Any]:
    """Build the getPublishedVacanciesList variables from unified filters."""
    salary = filters.salary_min or 0
    return {
        "pagination": {"count": page_size, "page": max(filters.page - 1, 0)},
        "filter": {
            "keywords": " ".join(filters.keywords).strip(),
            "salary": salary,
            "showWithoutSalary": salary == 0,
            "scheduleIds": [REMOTE_SCHEDULE_ID] if filters.remote else [],
            "rubrics": [],
            "additionalKeywords": "",
            "clusterKeywords": [],
            "showAgencies": True,
            "showOnlyWithoutExperience": False,
            "showOnlyNotViewed": False,
            "showOnlyNoCvApplyVacancies": False,
            "showOnlySpecialNeeds": False,
            "isForVeterans": False,
            "isReservation": False,
            "isOfficeWithGenerator": False,
            "isOfficeWithShelter": False,
            "militaryVacancyDisplayMode": "APPENDED",
            "metroBranches": [],
            "districtIds": [],
            "microDistrictIds": [],
            "branchIds": [],
            "gender": None,
            "location": {"latitude": 0, "longitude": 0},
        },
        "sort": "BY_BUSINESS_SCORE",
    }


def detail_variables(external_id: str) -> dict[str, Any]:
    """Build the getPublishedVacancy variables for a single vacancy id."""
    return {"id": external_id, "trackView": False}
