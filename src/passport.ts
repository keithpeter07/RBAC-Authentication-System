import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import Container, { Service } from 'typedi';
import dotenv from 'dotenv';
import { UserService } from './services/user.service';

const result = dotenv.config();
if (result.error) {
  dotenv.config({ path: '.env.example' });
}

@Service()
export default class PassportStrategy {
  private options;

  constructor(
    private readonly userService: UserService = Container.get(UserService)
  ) {
    this.options = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET
    };
  }

  createJwtStrategy() {
    return (
      new JwtStrategy(this.options, async (jwtPayload, done) => {
        const user = await this.userService.getOne(jwtPayload.id);

        if (!user) {
          return done(null, false);
        }

        return done(null, user);
      })
    );
  }
}
