<template>
	<div class="m-6">
		<h1 class="mb-4">GitHub Markdown Editor clone</h1>
		<gh-md-editor
			v-model="comment"
			storage-key="my-draft"
			:at-items="users"
			:hash-items="issues"
		/>
	</div>
</template>

<script>
import users from './data/users.json'
import issues from './data/issues.json'
import GhMdEditor from './GhMdEditor'

export default {
	data() {
		return { comment: '' }
	},
	computed: {
    users() {
      return users.map((user) => ({
        fullName: user.username + ' ' + user.name,
        ...user
      }))
    },
		issues() {
      return issues.map((issue) => ({
        full: issue.number + ' ' + issue.title,
        ...issue
      }))
    }
	},
	components: {
		GhMdEditor
	}
}
</script>

