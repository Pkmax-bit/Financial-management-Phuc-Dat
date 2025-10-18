from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


FeedbackCategory = Literal['performance', 'behavior', 'attendance', 'kudos', 'other']


class EmployeeFeedback(BaseModel):
    id: str
    employee_id: str
    given_by: str
    title: str
    content: str
    category: FeedbackCategory = 'other'
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    is_public: bool = False
    created_at: datetime
    updated_at: datetime


class EmployeeFeedbackCreate(BaseModel):
    employee_id: str
    given_by: Optional[str] = None
    title: str
    content: str
    category: FeedbackCategory = 'other'
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    is_public: bool = False


class EmployeeFeedbackUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[FeedbackCategory] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    is_public: Optional[bool] = None



