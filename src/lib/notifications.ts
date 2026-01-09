import { prisma } from '@/lib/prisma'

type NotificationType =
  | 'new_post'
  | 'new_car'
  | 'car_comment'
  | 'car_rating'
  | 'new_follower'
  | 'car_followed'
  | 'post_like'
  | 'post_comment'

interface CreateNotificationParams {
  type: NotificationType
  userId: string // Who receives the notification
  actorId: string // Who triggered it
  message: string
  postId?: string
  carId?: string
}

export async function createNotification(params: CreateNotificationParams) {
  const { type, userId, actorId, message, postId, carId } = params

  // Don't notify yourself
  if (userId === actorId) return null

  try {
    return await prisma.notification.create({
      data: {
        type,
        userId,
        actorId,
        message,
        postId,
        carId,
      },
    })
  } catch (error) {
    console.error('[createNotification] failed', error)
    return null
  }
}

// Notify all followers of a user about a new post
export async function notifyFollowersAboutPost(
  authorId: string,
  postId: string,
  carId: string | null,
  carName: string
) {
  try {
    // Get all followers of the author
    const followers = await prisma.follow.findMany({
      where: { followingId: authorId },
      select: { followerId: true },
    })

    // Get all followers of the car (if carId exists)
    let carFollowers: { followerId: string }[] = []
    if (carId) {
      carFollowers = await prisma.carFollow.findMany({
        where: { carId },
        select: { followerId: true },
      })
    }

    // Combine and dedupe follower IDs
    const allFollowerIds = new Set([
      ...followers.map((f) => f.followerId),
      ...carFollowers.map((f) => f.followerId),
    ])

    // Remove the author from notifications
    allFollowerIds.delete(authorId)

    const author = await prisma.user.findUnique({
      where: { id: authorId },
      select: { username: true, name: true },
    })

    const authorName = author?.name || author?.username || 'Someone'

    // Create notifications for all followers
    const notifications = Array.from(allFollowerIds).map((followerId) => ({
      type: 'new_post',
      userId: followerId,
      actorId: authorId,
      message: `${authorName} posted about ${carName}`,
      postId,
      carId,
    }))

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      })
    }
  } catch (error) {
    console.error('[notifyFollowersAboutPost] failed', error)
  }
}

// Notify car owner about a new comment on their car
export async function notifyCarOwnerAboutComment(
  carId: string,
  commentAuthorId: string,
  commentContent: string
) {
  try {
    const car = await prisma.car.findUnique({
      where: { id: carId },
      select: {
        ownerId: true,
        nickname: true,
        year: true,
        generation: {
          select: {
            model: {
              select: {
                name: true,
                make: { select: { name: true } },
              },
            },
          },
        },
      },
    })

    if (!car || car.ownerId === commentAuthorId) return

    const carName = car.generation
      ? `${car.year} ${car.generation.model.make.name} ${car.generation.model.name}`
      : car.nickname || 'your car'

    const author = await prisma.user.findUnique({
      where: { id: commentAuthorId },
      select: { username: true, name: true },
    })

    const authorName = author?.name || author?.username || 'Someone'

    await createNotification({
      type: 'car_comment',
      userId: car.ownerId,
      actorId: commentAuthorId,
      message: `${authorName} commented on ${carName}`,
      carId,
    })
  } catch (error) {
    console.error('[notifyCarOwnerAboutComment] failed', error)
  }
}

// Notify car owner about a new rating
export async function notifyCarOwnerAboutRating(
  carId: string,
  ratingUserId: string,
  rating: number
) {
  try {
    const car = await prisma.car.findUnique({
      where: { id: carId },
      select: {
        ownerId: true,
        nickname: true,
        year: true,
        generation: {
          select: {
            model: {
              select: {
                name: true,
                make: { select: { name: true } },
              },
            },
          },
        },
      },
    })

    if (!car || car.ownerId === ratingUserId) return

    const carName = car.generation
      ? `${car.year} ${car.generation.model.make.name} ${car.generation.model.name}`
      : car.nickname || 'your car'

    const rater = await prisma.user.findUnique({
      where: { id: ratingUserId },
      select: { username: true, name: true },
    })

    const raterName = rater?.name || rater?.username || 'Someone'

    await createNotification({
      type: 'car_rating',
      userId: car.ownerId,
      actorId: ratingUserId,
      message: `${raterName} rated ${carName} ${rating}/10`,
      carId,
    })
  } catch (error) {
    console.error('[notifyCarOwnerAboutRating] failed', error)
  }
}

// Notify user about new follower
export async function notifyAboutNewFollower(userId: string, followerId: string) {
  try {
    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: { username: true, name: true },
    })

    const followerName = follower?.name || follower?.username || 'Someone'

    await createNotification({
      type: 'new_follower',
      userId,
      actorId: followerId,
      message: `${followerName} started following you`,
    })
  } catch (error) {
    console.error('[notifyAboutNewFollower] failed', error)
  }
}

// Notify post author about a like
export async function notifyPostAuthorAboutLike(postId: string, likerId: string) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        authorId: true,
        title: true,
      },
    })

    if (!post || post.authorId === likerId) return

    const liker = await prisma.user.findUnique({
      where: { id: likerId },
      select: { username: true, name: true },
    })

    const likerName = liker?.name || liker?.username || 'Someone'
    const postTitle = post.title.length > 30 ? post.title.substring(0, 30) + '...' : post.title

    await createNotification({
      type: 'post_like',
      userId: post.authorId,
      actorId: likerId,
      message: `${likerName} liked your post "${postTitle}"`,
      postId,
    })
  } catch (error) {
    console.error('[notifyPostAuthorAboutLike] failed', error)
  }
}

// Notify post author about a comment
export async function notifyPostAuthorAboutComment(
  postId: string,
  commentAuthorId: string,
  commentContent: string
) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        authorId: true,
        title: true,
      },
    })

    if (!post || post.authorId === commentAuthorId) return

    const commenter = await prisma.user.findUnique({
      where: { id: commentAuthorId },
      select: { username: true, name: true },
    })

    const commenterName = commenter?.name || commenter?.username || 'Someone'

    await createNotification({
      type: 'post_comment',
      userId: post.authorId,
      actorId: commentAuthorId,
      message: `${commenterName} commented on your post`,
      postId,
    })
  } catch (error) {
    console.error('[notifyPostAuthorAboutComment] failed', error)
  }
}
