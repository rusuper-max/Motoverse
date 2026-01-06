export default {
  // Common
  common: {
    appName: 'Motoverse',
    loading: 'Loading...',
    error: 'Something went wrong',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    seeAll: 'See all',
    learnMore: 'Learn more',
  },

  // Navigation
  nav: {
    feed: 'Feed',
    cars: 'Cars',
    explore: 'Explore',
    myGarage: 'My Garage',
    newPost: 'New Post',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    getStarted: 'Get Started',
    profile: 'Profile',
  },

  // Landing page
  landing: {
    hero: {
      title1: 'Your cars.',
      title2: 'Your stories.',
      title3: 'Your community.',
      subtitle: 'Join the ultimate social network for car enthusiasts. Share your garage, document your builds, connect with fellow petrolheads, and even sell your rides.',
      cta: 'Get Started Free',
      exploreCta: 'Explore Builds',
    },
    gearShifter: {
      scrollToShift: 'Scroll to shift gears',
      neutral: 'Neutral',
      reverse: 'Back to Top',
    },
    stats: {
      enthusiasts: 'Car Enthusiasts',
      carsInGarages: 'Cars in Garages',
      buildPosts: 'Build Posts',
      carsSold: 'Cars Sold',
    },
    features: {
      title: 'Everything you need for your car passion',
      subtitle: 'Built by enthusiasts, for enthusiasts',
      garage: {
        title: 'Your Digital Garage',
        description: 'Showcase all your cars in one place. Track modifications, maintenance history, and share your builds with the community.',
      },
      builds: {
        title: 'Document Your Builds',
        description: 'Create detailed posts about your modifications, repairs, and upgrades. Help others learn from your experience.',
      },
      community: {
        title: 'Connect with Enthusiasts',
        description: 'Follow other car lovers, join discussions, and discover amazing builds from around the world.',
      },
      marketplace: {
        title: 'Marketplace',
        description: 'Buy and sell cars directly from fellow enthusiasts. No dealers, no middlemen - just real car people.',
      },
      events: {
        title: 'Car Meets & Events',
        description: 'Discover local car meets, shows, and track days. Never miss a gathering of fellow enthusiasts.',
      },
    },
    howItWorks: {
      title: 'How Motoverse works',
      step1: {
        title: '1. Add your cars',
        description: 'Create your digital garage. Add all your current and past vehicles with specs and photos.',
      },
      step2: {
        title: '2. Share your journey',
        description: 'Post about modifications, maintenance, road trips, and everything car-related.',
      },
      step3: {
        title: '3. Join the community',
        description: 'Follow enthusiasts, comment on builds, get advice, and make friends who share your passion.',
      },
    },
    cta: {
      title: 'Ready to join the community?',
      subtitle: 'Create your free account and start building your digital garage today.',
      button: 'Create Free Account',
    },
  },

  // Cars catalog
  cars: {
    title: 'Car Catalog',
    subtitle: 'Browse cars by make and model. Find your ride or discover what others are driving.',
    searchPlaceholder: 'Search makes and models...',
    popularMakes: 'Popular Makes',
    allMakes: 'All Makes',
    models: 'models',
    noModelsYet: 'No models yet',
    beFirstToAdd: 'Be the first to add a {make} to your garage!',
    inGarages: 'in garages',
    addToGarage: 'Add to My Garage',
    communityGarages: 'Community Garages',
    noCarsYet: 'No {model}s in garages yet',
    beFirstToAddModel: 'Be the first to add your {make} {model}!',
    addYourCar: 'Add Your Car',
    posts: 'posts',
  },

  // Body types
  bodyTypes: {
    sedan: 'Sedan',
    hatchback: 'Hatchback',
    suv: 'SUV',
    coupe: 'Coupe',
    wagon: 'Wagon',
    convertible: 'Convertible',
    truck: 'Truck',
    van: 'Van',
    other: 'Other',
  },

  // Post categories
  postCategories: {
    maintenance: 'Maintenance',
    modification: 'Modification',
    journey: 'Journey',
    review: 'Review',
    other: 'Other',
  },

  // Footer
  footer: {
    about: 'About',
    terms: 'Terms',
    privacy: 'Privacy',
    contact: 'Contact',
    copyright: '© {year} Motoverse. All rights reserved.',
  },

  // Garage
  garage: {
    title: 'My Garage',
    addCar: 'Add Car',
    noCars: 'Your garage is empty',
    addFirstCar: 'Add your first car to get started!',
    carCount: '{count} car(s)',
    viewCar: 'View',
    editCar: 'Edit',
    deleteCar: 'Delete',
    posts: 'posts',
    mileage: 'Mileage',
    horsepower: 'HP',
    confirmDelete: 'Are you sure you want to delete this car? This will also delete all posts associated with it.',
    addCarTitle: 'Add a Car',
    addCarSubtitle: 'Add a new car to your garage',
    selectMake: 'Select Make',
    selectModel: 'Select Model',
    year: 'Year',
    nickname: 'Nickname (optional)',
    nicknamePlaceholder: 'e.g., "Daily Driver" or "Project Car"',
    engine: 'Engine',
    enginePlaceholder: 'e.g., 2.0L Turbo',
    transmission: 'Transmission',
    transmissions: {
      manual: 'Manual',
      automatic: 'Automatic',
      cvt: 'CVT',
      dct: 'DCT/DSG',
      other: 'Other',
    },
    drivetrain: 'Drivetrain',
    drivetrains: {
      fwd: 'FWD',
      rwd: 'RWD',
      awd: 'AWD',
      '4wd': '4WD',
    },
    fuelType: 'Fuel Type',
    fuelTypes: {
      petrol: 'Petrol/Gasoline',
      diesel: 'Diesel',
      electric: 'Electric',
      hybrid: 'Hybrid',
      lpg: 'LPG',
    },
    horsepowerLabel: 'Horsepower',
    horsepowerPlaceholder: 'e.g., 200',
    color: 'Color',
    colorPlaceholder: 'e.g., Nardo Grey',
    mileageLabel: 'Current Mileage',
    mileagePlaceholder: 'e.g., 50000',
    purchaseDate: 'Purchase Date',
    addCarButton: 'Add to Garage',
    adding: 'Adding...',
    carAdded: 'Car added to your garage!',
    errors: {
      selectMake: 'Please select a make',
      selectModel: 'Please select a model',
      selectYear: 'Please select a year',
      failed: 'Failed to add car. Please try again.',
    },
  },

  // Profile
  profile: {
    followers: 'Followers',
    following: 'Following',
    posts: 'Posts',
    cars: 'Cars',
    follow: 'Follow',
    unfollow: 'Unfollow',
    editProfile: 'Edit Profile',
  },

  // Auth
  auth: {
    register: {
      title: 'Create your account',
      subtitle: 'Join the Motoverse community',
      emailLabel: 'Email address',
      emailPlaceholder: 'you@example.com',
      usernameLabel: 'Username',
      usernamePlaceholder: 'gearhead',
      usernameHint: '3-20 characters, letters, numbers and underscores',
      passwordLabel: 'Password',
      passwordPlaceholder: 'At least 8 characters',
      nameLabel: 'Display name (optional)',
      namePlaceholder: 'How should we call you?',
      submitButton: 'Create Account',
      submitting: 'Creating account...',
      haveAccount: 'Already have an account?',
      signInLink: 'Sign in',
      errors: {
        missingFields: 'Please fill in all required fields',
        invalidEmail: 'Please enter a valid email address',
        invalidUsername: 'Username must be 3-20 characters, start with a letter',
        weakPassword: 'Password must be at least 8 characters',
        emailTaken: 'An account with this email already exists',
        usernameTaken: 'This username is already taken',
        failed: 'Something went wrong. Please try again.',
      },
    },
    login: {
      title: 'Welcome back',
      subtitle: 'Sign in to your Motoverse account',
      emailLabel: 'Email address',
      emailPlaceholder: 'you@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Your password',
      submitButton: 'Sign In',
      submitting: 'Signing in...',
      noAccount: "Don't have an account?",
      registerLink: 'Create one',
      forgotPassword: 'Forgot password?',
      errors: {
        missingFields: 'Please enter your email and password',
        invalidEmail: 'Please enter a valid email address',
        invalidCredentials: 'Invalid email or password',
        failed: 'Something went wrong. Please try again.',
      },
    },
  },
} as const
