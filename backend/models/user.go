package models

import (
	"github.com/jinzhu/gorm"
)

type User struct {
	gorm.Model
	Name     string `json:"name" gorm:"not null"`
	Username string `json:"username" gorm:"unique;not null"`
	Password string `json:"-" gorm:"not null"`
	Role     string `json:"role" gorm:"not null"` // Quản trị viên, Trưởng Công An Xã, Phó Công An Xã, Văn thư, Cán bộ
}

// Role constants
const (
	RoleAdmin      = "Quản trị viên"
	RoleTeamLeader = "Trưởng Công An Xã"
	RoleDeputy     = "Phó Công An Xã"
	RoleSecretary  = "Văn thư"
	RoleOfficer    = "Cán bộ"
)

func (u *User) IsTeamLeaderOrDeputy() bool {
	return u.Role == RoleTeamLeader || u.Role == RoleDeputy
}

func (u *User) CanCreateTask() bool {
	return u.Role == RoleSecretary
}

func (u *User) CanAssignTask() bool {
	return u.Role == RoleTeamLeader || u.Role == RoleDeputy
}